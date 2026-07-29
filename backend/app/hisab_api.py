from __future__ import annotations

import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .hisab_db import (
    BusinessType,
    Party,
    Payable,
    PaymentMethod,
    Receivable,
    SourceType,
    Transaction,
    TransactionStatus,
    TransactionType,
    get_db,
)
from .main import app

router = APIRouter(prefix="/api/hisab", tags=["hisab"])


# Pydantic models for requests/responses
class TransactionCreate(BaseModel):
    weaver_id: str
    transaction_type: str
    amount_inr: float = Field(gt=0)
    category: str
    business_or_personal: str = "business"
    payment_method: str = "cash"
    party_id: Optional[str] = None
    order_id: Optional[str] = None
    material_purchase_id: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[str] = None
    source: str = "manual"
    metadata_json: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount_inr: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[str] = None


class PartyCreate(BaseModel):
    weaver_id: str
    name: str
    phone: Optional[str] = None
    type: str = "buyer"
    notes: Optional[str] = None


class PaymentMatch(BaseModel):
    receivable_id: str
    amount_inr: float = Field(gt=0)
    payment_method: str = "cash"
    transaction_date: Optional[str] = None
    description: Optional[str] = None


# Helper functions
def _get_today() -> datetime:
    return datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)


def _parse_date(date_str: Optional[str]) -> datetime:
    if not date_str:
        return _get_today()
    return datetime.fromisoformat(date_str)


def _transaction_to_dict(tx: Transaction) -> dict[str, Any]:
    return {
        "id": tx.id,
        "weaver_id": tx.weaver_id,
        "transaction_type": tx.transaction_type.value,
        "amount_inr": float(tx.amount_inr),
        "category": tx.category,
        "business_or_personal": tx.business_or_personal.value,
        "payment_method": tx.payment_method.value,
        "party_id": tx.party_id,
        "party_name": tx.party.name if tx.party else None,
        "order_id": tx.order_id,
        "material_purchase_id": tx.material_purchase_id,
        "description": tx.description,
        "transaction_date": tx.transaction_date.isoformat(),
        "source": tx.source.value,
        "status": tx.status.value,
        "created_at": tx.created_at.isoformat(),
    }


def _party_to_dict(party: Party) -> dict[str, Any]:
    return {
        "id": party.id,
        "weaver_id": party.weaver_id,
        "name": party.name,
        "phone": party.phone,
        "type": party.type.value,
        "notes": party.notes,
        "created_at": party.created_at.isoformat(),
    }


# Hisab Summary
@router.get("/summary")
def get_hisab_summary(
    weaver_id: str = Query(...),
    db: Session = Depends(get_db),
):
    today = _get_today()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Monthly transactions
    monthly_txs = db.query(Transaction).filter(
        Transaction.weaver_id == weaver_id,
        Transaction.transaction_date >= month_start,
        Transaction.status == TransactionStatus.CONFIRMED,
    ).all()
    
    # Calculate monthly totals
    money_in = sum(
        float(tx.amount_inr) for tx in monthly_txs
        if tx.transaction_type in (TransactionType.INCOME, TransactionType.SALE, TransactionType.PAYMENT_RECEIVED)
        and tx.business_or_personal == BusinessType.BUSINESS
    )
    
    money_out = sum(
        float(tx.amount_inr) for tx in monthly_txs
        if tx.transaction_type in (TransactionType.EXPENSE, TransactionType.PURCHASE, TransactionType.PAYMENT_MADE)
        and tx.business_or_personal == BusinessType.BUSINESS
    )
    
    personal_withdrawals = sum(
        float(tx.amount_inr) for tx in monthly_txs
        if tx.transaction_type == TransactionType.PERSONAL_WITHDRAWAL
    )
    
    net_cash = money_in - money_out
    
    # Receivables and Payables
    receivables = db.query(Receivable).filter(
        Receivable.weaver_id == weaver_id,
        Receivable.status.in_(["pending", "partial", "overdue"]),
    ).all()
    
    payables = db.query(Payable).filter(
        Payable.weaver_id == weaver_id,
        Payable.status.in_(["pending", "partial", "overdue"]),
    ).all()
    
    to_receive = sum(float(r.total_amount_inr - r.paid_amount_inr) for r in receivables)
    to_pay = sum(float(p.total_amount_inr - p.paid_amount_inr) for p in payables)
    
    # Count alerts
    overdue_receivables = [r for r in receivables if r.status == "overdue" or (r.due_date and r.due_date < today and r.status != "paid")]
    alert_count = len(overdue_receivables)
    
    return {
        "month": today.strftime("%B %Y"),
        "net_cash_movement": round(net_cash, 2),
        "money_in": round(money_in, 2),
        "money_out": round(money_out, 2),
        "personal_withdrawals": round(personal_withdrawals, 2),
        "to_receive": round(to_receive, 2),
        "to_pay": round(to_pay, 2),
        "alert_count": alert_count,
        "overdue_items": [
            {
                "id": r.id,
                "party_name": r.party.name if r.party else "Unknown",
                "amount": float(r.total_amount_inr - r.paid_amount_inr),
                "due_date": r.due_date.isoformat() if r.due_date else None,
                "days_overdue": (today - r.due_date).days if r.due_date else 0,
            }
            for r in overdue_receivables[:3]
        ],
    }


# Transactions CRUD
@router.get("/transactions")
def get_transactions(
    weaver_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    transaction_type: Optional[str] = None,
    category: Optional[str] = None,
    business_or_personal: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.weaver_id == weaver_id)
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Transaction.transaction_date <= datetime.fromisoformat(end_date))
    if transaction_type:
        query = query.filter(Transaction.transaction_type == TransactionType(transaction_type))
    if category:
        query = query.filter(Transaction.category == category)
    if business_or_personal:
        query = query.filter(Transaction.business_or_personal == BusinessType(business_or_personal))
    
    transactions = query.order_by(Transaction.transaction_date.desc()).limit(limit).offset(offset).all()
    
    return {
        "transactions": [_transaction_to_dict(tx) for tx in transactions],
        "total": query.count(),
    }


@router.post("/transactions")
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    # Validate transaction type
    try:
        tx_type = TransactionType(payload.transaction_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid transaction type: {payload.transaction_type}")
    
    # Validate business type
    try:
        biz_type = BusinessType(payload.business_or_personal)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid business type: {payload.business_or_personal}")
    
    # Validate payment method
    try:
        pay_method = PaymentMethod(payload.payment_method)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid payment method: {payload.payment_method}")
    
    # Validate source
    try:
        source = SourceType(payload.source)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid source: {payload.source}")
    
    transaction_date = _parse_date(payload.transaction_date)
    
    transaction = Transaction(
        weaver_id=payload.weaver_id,
        transaction_type=tx_type,
        amount_inr=Decimal(str(payload.amount_inr)),
        category=payload.category,
        business_or_personal=biz_type,
        payment_method=pay_method,
        party_id=payload.party_id,
        order_id=payload.order_id,
        material_purchase_id=payload.material_purchase_id,
        description=payload.description,
        transaction_date=transaction_date,
        source=source,
        metadata_json=payload.metadata_json,
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    return _transaction_to_dict(transaction)


@router.patch("/transactions/{transaction_id}")
def update_transaction(transaction_id: str, payload: TransactionUpdate, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if payload.amount_inr is not None:
        transaction.amount_inr = Decimal(str(payload.amount_inr))
    if payload.category is not None:
        transaction.category = payload.category
    if payload.description is not None:
        transaction.description = payload.description
    if payload.transaction_date is not None:
        transaction.transaction_date = _parse_date(payload.transaction_date)
    
    transaction.updated_at = datetime.now()
    
    db.commit()
    db.refresh(transaction)
    
    return _transaction_to_dict(transaction)


@router.post("/transactions/{transaction_id}/reverse")
def reverse_transaction(transaction_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status == TransactionStatus.REVERSED:
        raise HTTPException(status_code=400, detail="Transaction is already reversed")
    
    # Create reversal transaction
    reversal_type_map = {
        TransactionType.INCOME: TransactionType.ADJUSTMENT,
        TransactionType.EXPENSE: TransactionType.ADJUSTMENT,
        TransactionType.SALE: TransactionType.ADJUSTMENT,
        TransactionType.PURCHASE: TransactionType.ADJUSTMENT,
        TransactionType.PAYMENT_RECEIVED: TransactionType.PAYMENT_MADE,
        TransactionType.PAYMENT_MADE: TransactionType.PAYMENT_RECEIVED,
        TransactionType.PERSONAL_WITHDRAWAL: TransactionType.PERSONAL_DEPOSIT,
        TransactionType.PERSONAL_DEPOSIT: TransactionType.PERSONAL_WITHDRAWAL,
    }
    
    reversal = Transaction(
        weaver_id=transaction.weaver_id,
        transaction_type=reversal_type_map.get(transaction.transaction_type, TransactionType.ADJUSTMENT),
        amount_inr=transaction.amount_inr,
        category=transaction.category,
        business_or_personal=transaction.business_or_personal,
        payment_method=transaction.payment_method,
        party_id=transaction.party_id,
        order_id=transaction.order_id,
        material_purchase_id=transaction.material_purchase_id,
        description=f"Reversal of transaction {transaction.id}: {transaction.description or ''}",
        transaction_date=datetime.now(),
        source=SourceType.SYSTEM,
        metadata_json=json.dumps({"reverses": transaction_id}),
    )
    
    transaction.status = TransactionStatus.REVERSED
    
    db.add(reversal)
    db.commit()
    db.refresh(reversal)
    
    return _transaction_to_dict(reversal)


# Parties CRUD
@router.get("/parties")
def get_parties(
    weaver_id: str = Query(...),
    type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Party).filter(Party.weaver_id == weaver_id)
    if type:
        query = query.filter(Party.type == PartyType(type))
    
    parties = query.order_by(Party.name).all()
    
    return {"parties": [_party_to_dict(p) for p in parties]}


@router.post("/parties")
def create_party(payload: PartyCreate, db: Session = Depends(get_db)):
    try:
        party_type = PartyType(payload.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid party type: {payload.type}")
    
    party = Party(
        weaver_id=payload.weaver_id,
        name=payload.name,
        phone=payload.phone,
        type=party_type,
        notes=payload.notes,
    )
    
    db.add(party)
    db.commit()
    db.refresh(party)
    
    return _party_to_dict(party)


# Receivables
@router.get("/receivables")
def get_receivables(
    weaver_id: str = Query(...),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Receivable).filter(Receivable.weaver_id == weaver_id)
    if status:
        query = query.filter(Receivable.status == status)
    
    receivables = query.order_by(Receivable.due_date).all()
    
    result = []
    for r in receivables:
        result.append({
            "id": r.id,
            "party_id": r.party_id,
            "party_name": r.party.name if r.party else "Unknown",
            "order_id": r.order_id,
            "total_amount_inr": float(r.total_amount_inr),
            "paid_amount_inr": float(r.paid_amount_inr),
            "pending_amount_inr": float(r.total_amount_inr - r.paid_amount_inr),
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        })
    
    return {"receivables": result}


# Payables
@router.get("/payables")
def get_payables(
    weaver_id: str = Query(...),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Payable).filter(Payable.weaver_id == weaver_id)
    if status:
        query = query.filter(Payable.status == status)
    
    payables = query.order_by(Payable.due_date).all()
    
    result = []
    for p in payables:
        result.append({
            "id": p.id,
            "party_id": p.party_id,
            "party_name": p.party.name if p.party else "Unknown",
            "total_amount_inr": float(p.total_amount_inr),
            "paid_amount_inr": float(p.paid_amount_inr),
            "pending_amount_inr": float(p.total_amount_inr - p.paid_amount_inr),
            "due_date": p.due_date.isoformat() if p.due_date else None,
            "status": p.status,
            "created_at": p.created_at.isoformat(),
        })
    
    return {"payables": result}


# Monthly Summary
@router.get("/monthly")
def get_monthly_summary(
    weaver_id: str = Query(...),
    year: int = Query(datetime.now().year),
    month: int = Query(datetime.now().month),
    db: Session = Depends(get_db),
):
    month_start = datetime(year, month, 1)
    if month == 12:
        month_end = datetime(year + 1, 1, 1)
    else:
        month_end = datetime(year, month + 1, 1)
    
    transactions = db.query(Transaction).filter(
        Transaction.weaver_id == weaver_id,
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end,
        Transaction.status == TransactionStatus.CONFIRMED,
    ).all()
    
    # Calculate totals
    sales = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.SALE)
    cash_received = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.PAYMENT_RECEIVED)
    expenses = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.EXPENSE)
    cash_paid = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.PAYMENT_MADE)
    personal_withdrawals = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.PERSONAL_WITHDRAWAL)
    
    # Category breakdown
    category_breakdown = {}
    for tx in transactions:
        if tx.business_or_personal == BusinessType.BUSINESS:
            cat = tx.category
            if cat not in category_breakdown:
                category_breakdown[cat] = 0
            category_breakdown[cat] += float(tx.amount_inr)
    
    # Receivables/Payables at month end
    receivables = db.query(Receivable).filter(
        Receivable.weaver_id == weaver_id,
        Receivable.status.in_(["pending", "partial", "overdue"]),
    ).all()
    
    payables = db.query(Payable).filter(
        Payable.weaver_id == weaver_id,
        Payable.status.in_(["pending", "partial", "overdue"]),
    ).all()
    
    return {
        "month": month_start.strftime("%B %Y"),
        "sales_recorded": round(sales, 2),
        "cash_received": round(cash_received, 2),
        "expenses": round(expenses, 2),
        "cash_paid": round(cash_paid, 2),
        "personal_withdrawals": round(personal_withdrawals, 2),
        "net_cash_movement": round(cash_received - cash_paid, 2),
        "to_receive": round(sum(float(r.total_amount_inr - r.paid_amount_inr) for r in receivables), 2),
        "to_pay": round(sum(float(p.total_amount_inr - p.paid_amount_inr) for p in payables), 2),
        "category_breakdown": category_breakdown,
        "transaction_count": len(transactions),
    }


# Alerts
@router.get("/alerts")
def get_alerts(weaver_id: str = Query(...), db: Session = Depends(get_db)):
    today = _get_today()
    alerts = []
    
    # Overdue receivables
    overdue_receivables = db.query(Receivable).filter(
        Receivable.weaver_id == weaver_id,
        Receivable.status.in_(["pending", "partial"]),
        Receivable.due_date < today,
    ).all()
    
    for r in overdue_receivables:
        days_overdue = (today - r.due_date).days if r.due_date else 0
        alerts.append({
            "type": "payment_overdue",
            "priority": "critical",
            "title": "Payment Overdue",
            "message": f"₹{float(r.total_amount_inr - r.paid_amount_inr):,.0f} from {r.party.name if r.party else 'Unknown'}",
            "subtitle": f"{days_overdue} days overdue",
            "entity_id": r.id,
        })
    
    # Overdue payables
    overdue_payables = db.query(Payable).filter(
        Payable.weaver_id == weaver_id,
        Payable.status.in_(["pending", "partial"]),
        Payable.due_date < today,
    ).all()
    
    for p in overdue_payables:
        days_overdue = (today - p.due_date).days if p.due_date else 0
        alerts.append({
            "type": "payment_overdue_payable",
            "priority": "important",
            "title": "Supplier Payment Overdue",
            "message": f"₹{float(p.total_amount_inr - p.paid_amount_inr):,.0f} to {p.party.name if p.party else 'Unknown'}",
            "subtitle": f"{days_overdue} days overdue",
            "entity_id": p.id,
        })
    
    # Sort by priority
    priority_order = {"critical": 0, "important": 1, "informational": 2}
    alerts.sort(key=lambda x: priority_order.get(x["priority"], 3))
    
    return {"alerts": alerts[:10]}


# Buyer Intelligence
@router.get("/parties/{party_id}/intelligence")
def get_party_intelligence(party_id: str, weaver_id: str = Query(...), db: Session = Depends(get_db)):
    party = db.query(Party).filter(Party.id == party_id, Party.weaver_id == weaver_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")
    
    # Get all transactions with this party
    transactions = db.query(Transaction).filter(
        Transaction.weaver_id == weaver_id,
        Transaction.party_id == party_id,
        Transaction.status == TransactionStatus.CONFIRMED,
    ).order_by(Transaction.transaction_date.desc()).all()
    
    # Calculate metrics
    total_sales = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.SALE)
    total_received = sum(float(tx.amount_inr) for tx in transactions if tx.transaction_type == TransactionType.PAYMENT_RECEIVED)
    order_count = len([tx for tx in transactions if tx.transaction_type == TransactionType.SALE])
    
    # Average payment time
    payment_delays = []
    for tx in transactions:
        if tx.transaction_type == TransactionType.SALE and tx.order_id:
            # Find corresponding payment
            payment = next((t for t in transactions if t.transaction_type == TransactionType.PAYMENT_RECEIVED and t.order_id == tx.order_id), None)
            if payment:
                delay = (payment.transaction_date - tx.transaction_date).days
                payment_delays.append(delay)
    
    avg_payment_days = sum(payment_delays) / len(payment_delays) if payment_delays else None
    
    # Recent trend
    recent_transactions = [tx for tx in transactions if tx.transaction_date >= datetime.now() - timedelta(days=90)]
    recent_sales = sum(float(tx.amount_inr) for tx in recent_transactions if tx.transaction_type == TransactionType.SALE)
    older_transactions = [tx for tx in transactions if datetime.now() - timedelta(days=180) <= tx.transaction_date < datetime.now() - timedelta(days=90)]
    older_sales = sum(float(tx.amount_inr) for tx in older_transactions if tx.transaction_type == TransactionType.SALE)
    
    trend = "increasing" if recent_sales > older_sales else "decreasing" if recent_sales < older_sales else "stable"
    
    return {
        "party_id": party.id,
        "name": party.name,
        "type": party.type.value,
        "total_sales": round(total_sales, 2),
        "total_received": round(total_received, 2),
        "pending_amount": round(total_sales - total_received, 2),
        "order_count": order_count,
        "average_payment_days": avg_payment_days,
        "recent_trend": trend,
        "recent_sales": round(recent_sales, 2),
    }


# Payment Match
@router.post("/payment-match")
def match_payment(payload: PaymentMatch, db: Session = Depends(get_db)):
    receivable = db.query(Receivable).filter(Receivable.id == payload.receivable_id).first()
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    if float(payload.amount_inr) > float(receivable.total_amount_inr - receivable.paid_amount_inr):
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining balance")
    
    # Create payment transaction
    transaction = Transaction(
        weaver_id=receivable.weaver_id,
        transaction_type=TransactionType.PAYMENT_RECEIVED,
        amount_inr=Decimal(str(payload.amount_inr)),
        category="sale",
        business_or_personal=BusinessType.BUSINESS,
        payment_method=PaymentMethod(payload.payment_method),
        party_id=receivable.party_id,
        order_id=receivable.order_id,
        description=payload.description or f"Payment for receivable {receivable.id}",
        transaction_date=_parse_date(payload.transaction_date),
        source=SourceType.PAYMENT_MATCH,
    )
    
    db.add(transaction)
    
    # Update receivable
    receivable.paid_amount_inr += Decimal(str(payload.amount_inr))
    if receivable.paid_amount_inr >= receivable.total_amount_inr:
        receivable.status = "paid"
    else:
        receivable.status = "partial"
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "transaction": _transaction_to_dict(transaction),
        "receivable": {
            "id": receivable.id,
            "total_amount_inr": float(receivable.total_amount_inr),
            "paid_amount_inr": float(receivable.paid_amount_inr),
            "pending_amount_inr": float(receivable.total_amount_inr - receivable.paid_amount_inr),
            "status": receivable.status,
        },
    }


# Insights
@router.get("/insights")
def get_insights(weaver_id: str = Query(...), db: Session = Depends(get_db)):
    today = _get_today()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # Current month transactions
    current_month_txs = db.query(Transaction).filter(
        Transaction.weaver_id == weaver_id,
        Transaction.transaction_date >= month_start,
        Transaction.status == TransactionStatus.CONFIRMED,
    ).all()
    
    # Last month transactions
    last_month_txs = db.query(Transaction).filter(
        Transaction.weaver_id == weaver_id,
        Transaction.transaction_date >= last_month_start,
        Transaction.transaction_date < month_start,
        Transaction.status == TransactionStatus.CONFIRMED,
    ).all()
    
    insights = []
    
    # Income comparison
    current_income = sum(float(tx.amount_inr) for tx in current_month_txs if tx.transaction_type in (TransactionType.INCOME, TransactionType.SALE, TransactionType.PAYMENT_RECEIVED) and tx.business_or_personal == BusinessType.BUSINESS)
    last_income = sum(float(tx.amount_inr) for tx in last_month_txs if tx.transaction_type in (TransactionType.INCOME, TransactionType.SALE, TransactionType.PAYMENT_RECEIVED) and tx.business_or_personal == BusinessType.BUSINESS)
    
    if last_income > 0:
        change_pct = ((current_income - last_income) / last_income) * 100
        insights.append({
            "type": "income_trend",
            "title": "Monthly Income",
            "message": f"You received ₹{current_income:,.0f} this month",
            "comparison": f"{change_pct:+.1f}% compared with last month",
            "detail": f"Last month: ₹{last_income:,.0f}",
        })
    elif current_income > 0:
        insights.append({
            "type": "income_trend",
            "title": "Building Your History",
            "message": f"You received ₹{current_income:,.0f} this month",
            "comparison": "Continue recording to see trends",
        })
    
    # Expense breakdown
    current_expenses = [tx for tx in current_month_txs if tx.transaction_type in (TransactionType.EXPENSE, TransactionType.PURCHASE) and tx.business_or_personal == BusinessType.BUSINESS]
    if current_expenses:
        category_totals = {}
        for tx in current_expenses:
            cat = tx.category
            category_totals[cat] = category_totals.get(cat, 0) + float(tx.amount_inr)
        
        total_expenses = sum(category_totals.values())
        top_category = max(category_totals.items(), key=lambda x: x[1])
        top_pct = (top_category[1] / total_expenses * 100) if total_expenses > 0 else 0
        
        insights.append({
            "type": "expense_breakdown",
            "title": "Expense Breakdown",
            "message": f"{top_category[0].replace('_', ' ').title()} represents {top_pct:.0f}% of your recorded business expenses this month",
            "detail": f"Total expenses: ₹{total_expenses:,.0f}",
        })
    
    # Pending receivables
    receivables = db.query(Receivable).filter(
        Receivable.weaver_id == weaver_id,
        Receivable.status.in_(["pending", "partial", "overdue"]),
    ).all()
    
    if receivables:
        total_pending = sum(float(r.total_amount_inr - r.paid_amount_inr) for r in receivables)
        insights.append({
            "type": "pending_receivables",
            "title": "Money to Receive",
            "message": f"₹{total_pending:,.0f} is currently pending from {len(receivables)} buyer(s)",
            "detail": "Follow up on overdue payments",
        })
    
    return {"insights": insights}


# Include router in main app
app.include_router(router)