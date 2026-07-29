from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    create_engine,
    func,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

from pipeline_common import ROOT_DIR

Base = declarative_base()

# Use SQLite database in the project root
DATABASE_URL = f"sqlite:///{ROOT_DIR}/hisab.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    SALE = "sale"
    PURCHASE = "purchase"
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_MADE = "payment_made"
    PERSONAL_WITHDRAWAL = "personal_withdrawal"
    PERSONAL_DEPOSIT = "personal_deposit"
    ADJUSTMENT = "adjustment"


class BusinessType(str, Enum):
    BUSINESS = "business"
    PERSONAL = "personal"


class PaymentMethod(str, Enum):
    CASH = "cash"
    UPI = "upi"
    BANK = "bank"
    CREDIT = "credit"
    OTHER = "other"


class TransactionStatus(str, Enum):
    CONFIRMED = "confirmed"
    PENDING_CONFIRMATION = "pending_confirmation"
    REVERSED = "reversed"


class SourceType(str, Enum):
    MANUAL = "manual"
    VOICE = "voice"
    ORDER = "order"
    INVENTORY = "inventory"
    PAYMENT_MATCH = "payment_match"
    SYSTEM = "system"


class PartyType(str, Enum):
    BUYER = "buyer"
    SUPPLIER = "supplier"
    BOTH = "both"


class Party(Base):
    __tablename__ = "parties"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    weaver_id = Column(String, nullable=False, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    type = Column(SQLEnum(PartyType), nullable=False, default=PartyType.BUYER)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    transactions = relationship("Transaction", back_populates="party")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    weaver_id = Column(String, nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount_inr = Column(Numeric(12, 2), nullable=False)
    category = Column(String, nullable=False)
    business_or_personal = Column(SQLEnum(BusinessType), nullable=False, default=BusinessType.BUSINESS)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)
    party_id = Column(String, ForeignKey("parties.id"), nullable=True)
    order_id = Column(String, nullable=True)
    material_purchase_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    transaction_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    source = Column(SQLEnum(SourceType), nullable=False, default=SourceType.MANUAL)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.CONFIRMED)
    ai_confidence = Column(Numeric(3, 2), nullable=True)
    metadata_json = Column(Text, nullable=True)

    # Relationships
    party = relationship("Party", back_populates="transactions")


class Receivable(Base):
    __tablename__ = "receivables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    weaver_id = Column(String, nullable=False, index=True)
    party_id = Column(String, ForeignKey("parties.id"), nullable=False)
    order_id = Column(String, nullable=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    total_amount_inr = Column(Numeric(12, 2), nullable=False)
    paid_amount_inr = Column(Numeric(12, 2), nullable=False, default=0)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, partial, paid, overdue
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    party = relationship("Party")
    transaction = relationship("Transaction")


class Payable(Base):
    __tablename__ = "payables"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    weaver_id = Column(String, nullable=False, index=True)
    party_id = Column(String, ForeignKey("parties.id"), nullable=False)
    material_purchase_id = Column(String, nullable=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    total_amount_inr = Column(Numeric(12, 2), nullable=False)
    paid_amount_inr = Column(Numeric(12, 2), nullable=False, default=0)
    due_date = Column(DateTime, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending, partial, paid, overdue
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    party = relationship("Party")
    transaction = relationship("Transaction")


class MaterialPurchase(Base):
    __tablename__ = "material_purchases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    weaver_id = Column(String, nullable=False, index=True)
    party_id = Column(String, ForeignKey("parties.id"), nullable=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=True)
    material_type = Column(String, nullable=False)  # silk, cotton, wool, etc.
    quantity_kg = Column(Numeric(10, 2), nullable=False)
    price_per_kg_inr = Column(Numeric(10, 2), nullable=False)
    total_amount_inr = Column(Numeric(12, 2), nullable=False)
    purchase_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    party = relationship("Party")
    transaction = relationship("Transaction")


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()