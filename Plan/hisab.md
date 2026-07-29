You are working on the existing SAATHI codebase, an AI-powered decision-support platform for Indian handloom weavers.

Your task is to design and implement a major new feature:

========================================================
SAATHI HISAB
AUTOMATED FINANCIAL MEMORY + DIGITAL KHATA + AI FINANCE
========================================================

IMPORTANT:

Do NOT redesign or rebuild the existing application.

Do NOT remove or weaken any current feature.

Do NOT replace the existing visual identity, navigation, forecasting system, orders, AI assistant, multilingual support, profile, admin system, or recommendation system.

FIRST inspect the entire repository and understand:

- frontend architecture
- backend architecture
- database
- existing order model
- inventory-related data
- buyer data
- cashflow/income endpoints
- user/profile state
- authentication/user identification if any
- AI/Gemini integration
- translation system
- responsive/mobile CSS
- current navigation
- existing financial calculations

Reuse existing architecture wherever reasonable.

Before modifying code, identify which existing financial numbers are:
1. forecast values
2. cluster-level values
3. per-weaver values
4. actual recorded values

Never mix these concepts.

The purpose of Hisab is to create the missing ACTUAL FINANCIAL DATA layer for an individual weaver.

========================================================
1. PRODUCT PHILOSOPHY
========================================================

Many independent weavers maintain financial information using:

- physical notebooks
- informal khata
- memory
- WhatsApp messages
- order records
- payment receipts
- scattered information

SAATHI Hisab should become their financial memory.

The product should feel as simple as a traditional khata while providing:

- automated bookkeeping
- income tracking
- expense tracking
- buyer receivables
- supplier payables
- partial payments
- order-linked payments
- material purchases
- inventory integration
- product profitability
- cash-flow visibility
- personal vs business transactions
- voice entry
- multilingual entry
- AI categorization
- intelligent alerts
- financial summaries
- buyer payment intelligence
- personal learning
- decision-support integration

CORE PRINCIPLE:

RECORD ONCE → UPDATE EVERYTHING.

If an event happens elsewhere in SAATHI, the weaver should not manually enter the same information again.

However:

MANUAL ENTRY MUST ALWAYS EXIST.

If automation, voice recognition, AI, payment matching, or another subsystem fails, the weaver must always be able to record a transaction manually.

Never make the financial ledger dependent on AI.

========================================================
2. UX PRINCIPLE
========================================================

DO NOT BUILD ACCOUNTING SOFTWARE.

The underlying system may be sophisticated.

The interface must not be.

A weaver should understand their financial situation within approximately five seconds.

Avoid accounting terminology such as:

Debit
Credit
Journal
Accounts Receivable
Accounts Payable
Ledger Posting

Use human language:

Money In
Money Out
To Receive
To Pay
Profit
Sales
Expenses
My Hisab

Internally, proper accounting/data concepts may be used.

========================================================
3. NAVIGATION
========================================================

Add a primary feature:

HISAB

Determine the best location from the existing navigation.

Do not overcrowd mobile bottom navigation.

If there are already five primary tabs, inspect the information architecture and determine whether Hisab should:

- replace a lower-priority primary tab
- live under Money/Profile
- be accessible through Home
- use a More menu

But Hisab must remain easy to reach.

Do not blindly add a sixth tiny mobile navigation item.

========================================================
4. HISAB HOME
========================================================

Build a mobile-first dashboard.

Example structure:

-------------------------------------

My Hisab

July 2026

₹13,400
Net this month

↑ ₹24,600 Money In
↓ ₹11,200 Money Out

₹7,800
To Receive

₹4,200
To Pay

[ + Money In ] [ − Money Out ]

[ 🎤 Speak ]

[ + Add Entry ]

-------------------------------------

Below:

Important Alert

₹5,000 from Rameshbhai
7 days overdue

[View]

-------------------------------------

Recent Activity

Today
₹8,500 received • Rameshbhai
Order #104

₹3,200 spent • Silk
10 kg

Yesterday
₹600 spent • Transport

[View all]

-------------------------------------

Financial Insight

Material expenses increased 11%
compared with last month.

[Why?]

-------------------------------------

Use progressive disclosure.

Do NOT place twenty metrics on the first screen.

========================================================
5. CORE DATA MODEL
========================================================

Create a robust database-backed financial system.

Do NOT store financial records only in localStorage.

Use the existing database infrastructure.

Extend it cleanly.

At minimum implement models/tables equivalent to:

transactions
parties
payments
receivables
payables
material_purchases

and integrate with existing:

orders
users/weavers
inventory if present

Do not duplicate an existing entity if one already exists.

-------------------------------------
TRANSACTION
-------------------------------------

Suggested fields:

id
weaver_id
transaction_type

Types:

income
expense
sale
purchase
payment_received
payment_made
personal_withdrawal
personal_deposit
adjustment

amount_inr

category

Possible categories:

product_sale
raw_material
dye
transport
packaging
loom_maintenance
utilities
labour
market_fee
shipping
loan
personal
other

business_or_personal

business
personal

payment_method

cash
upi
bank
credit
other

party_id nullable
order_id nullable
material_purchase_id nullable

description
transaction_date
created_at
updated_at

source

manual
voice
order
inventory
payment_match
system

status

confirmed
pending_confirmation
reversed

ai_confidence nullable

metadata JSON where appropriate

-------------------------------------
PARTY
-------------------------------------

A party can be:

buyer
supplier
both

Fields:

id
weaver_id
name
phone optional
type
notes
created_at

-------------------------------------
PAYMENT / RECEIVABLE / PAYABLE
-------------------------------------

Support:

full payments
partial payments
advance payments
outstanding amounts
due dates
overdue status

Never derive these only from frontend state.

Persist them.

========================================================
6. BUSINESS VS PERSONAL MONEY
========================================================

Every transaction should support:

Business
Personal

Personal transactions should affect available cash where appropriate but MUST NOT corrupt business profitability.

Example:

Business cash = ₹25,000

Weaver withdraws ₹5,000 for household expenses.

Record:

Personal Withdrawal
₹5,000

Cash becomes:

₹20,000

But DO NOT classify ₹5,000 as textile production expense.

This distinction is important.

Keep the UI simple.

========================================================
7. MANUAL ENTRY
========================================================

Manual entry is mandatory.

Permanent action:

+ Add Entry

Provide two prominent actions:

+ Money In
− Money Out

Money In form:

Amount *
From
Reason/category
Buyer optional
Order optional
Payment method
Date
Business/Personal
Notes optional

Money Out:

Amount *
Purpose/category
Supplier optional
Material optional
Quantity optional
Payment method
Date
Business/Personal
Notes optional

Use smart defaults.

Only amount should generally be mandatory.

Do not create bureaucratic forms.

========================================================
8. VOICE ENTRY
========================================================

Integrate voice entry with the existing voice architecture.

Support:

Gujarati
Hindi
English

Also handle common mixed-language speech where practical.

Examples:

"Aaje 3200 rupiya nu silk lidhu."

Interpret:

type: expense
amount: 3200
category: raw_material
material: silk
date: today

Another:

"Rameshbhai e 15000 aapya, 5000 baki che."

Possible interpretation:

party: Rameshbhai
payment_received: 15000
remaining_receivable: 5000

If an appropriate open order exists, suggest matching it.

CRITICAL:

AI/voice must NEVER silently write financial transactions.

Always show:

-------------------------------------

I understood:

₹3,200 Money Out

Silk
Raw Material
Today
Business

[Confirm]

[Edit]

[Cancel]

-------------------------------------

Only CONFIRM writes to the financial ledger.

If confidence is low:

ask for the missing information.

Never invent amounts, parties, quantities, orders or payment status.

========================================================
9. ORDER AUTOMATION
========================================================

Integrate Hisab deeply with Orders.

Example:

Order:

4 Patola Sarees
₹8,000 each

Total:
₹32,000

Advance:
₹10,000

Automatically represent:

Sale value:
₹32,000

Money received:
₹10,000

To receive:
₹22,000

Do NOT count ₹32,000 as cash received.

When another ₹12,000 payment arrives:

Received total:
₹22,000

Pending:
₹10,000

Order:

Partially Paid

When remaining ₹10,000 arrives:

Paid:
₹32,000

Pending:
₹0

Order:

Paid

The user should never need to update Order and Hisab separately.

========================================================
10. UDHAR / TO RECEIVE
========================================================

Create:

TO RECEIVE

Each buyer has a simple khata.

Example:

Rameshbhai

₹13,000
To Receive

Order #124
₹5,000 pending
Due 24 July

Order #131
₹8,000 pending
Due 2 August

Total Business
₹64,000

Received
₹51,000

To Receive
₹13,000

Payment behaviour:

Usually pays in ~11 days

Do not create arbitrary AI trust scores.

Derive metrics from actual transaction history.

========================================================
11. TO PAY / SUPPLIER KHATA
========================================================

Implement the mirror system for suppliers.

Example:

Shakti Silk Traders

₹6,400
To Pay

Silk Purchase
10 kg

Purchase:
₹8,000

Paid:
₹3,000

Remaining:
₹5,000

Due:
31 July

Support:

partial payments
due dates
overdue supplier payments
payment history

========================================================
12. MATERIAL PURCHASE → INVENTORY
========================================================

If Inventory exists, integrate with it.

Example:

User records:

10 kg Silk
₹6,000

After confirmation:

Hisab:
−₹6,000

Inventory:
+10 kg silk

Material cost:
₹600/kg

Supplier history:
+purchase

Cash:
−₹6,000 if immediately paid

If bought on credit:

Expense/purchase:
₹6,000

Cash movement:
₹0 initially

To Pay:
₹6,000

This distinction is mandatory.

Do not confuse purchase value with cash payment.

========================================================
13. PRODUCT COSTING
========================================================

Use actual historical expenses where reliable.

Track costs associated with products/orders:

raw material
dye
transport
packaging
labour if applicable
other direct costs

Allow approximate allocation when exact mapping is unavailable.

Show clearly when profit is:

Estimated

versus

Actual

Example:

Patola Saree

Selling Price
₹9,500

Recorded Costs
₹3,800

Estimated Contribution
₹5,700

Do not claim accounting-grade net profit if overhead data is incomplete.

========================================================
14. INVENTORY INTELLIGENCE INTEGRATION
========================================================

Hisab and Inventory must communicate.

Example:

Forecast demand:
7 sarees

Confirmed orders:
3

Finished inventory:
2

Production gap:
2

Existing silk:
enough for 1

Hisab available business cash:
₹4,000

SAATHI should eventually be capable of reasoning:

Produce 1 now.

Material for additional production requires approximately ₹X.

₹Y buyer payment is expected Friday.

Re-evaluate after payment.

Do not allow recommendations to exceed production capacity or available resources without explaining the constraint.

========================================================
15. SMART ALERTS
========================================================

Create an alert engine driven primarily by deterministic business rules.

AI may explain alerts but should not be required to detect basic financial conditions.

Examples:

PAYMENT OVERDUE

₹5,000 from Rameshbhai
7 days overdue.

MATERIAL COST

Silk cost increased 12%
compared with your recent average.

LOW CASH

Upcoming material requirement:
₹8,200

Available business cash:
₹5,400

INCOME RISK

Expected upcoming payments are below recent levels.

SLOW PAYMENT

This buyer normally pays within 11 days.
Current payment has been pending for 21 days.

UPCOMING PAYMENT

₹8,000 expected tomorrow.

Do not spam.

Prioritize alerts:

critical
important
informational

Show only important items on Home.

========================================================
16. BUYER INTELLIGENCE
========================================================

Build buyer intelligence using REAL transaction/order history.

For each buyer calculate where data exists:

number of orders
total sales
amount received
amount pending
average order value
average payment time
on-time payment rate
repeat purchase frequency
most purchased products
recent purchase trend

Example:

Ramesh Textiles

14 completed orders

₹1.24L total business

₹13,000 pending

Average payment:
11 days

Repeat business:
High

Most purchased:
Patola Saree

Recent activity:
Increasing

Avoid opaque:

Buyer Score: 83

Prefer transparent facts.

========================================================
17. PERSONAL LEARNING
========================================================

Hisab becomes a major input for personalization.

Track over time:

recommended production
actual production
actual sales
selling price
material costs
other costs
income
expenses
inventory
buyer behaviour
payment delays
production capacity

Then calculate personal historical patterns.

Example:

Market demand supports:
7 units

Your average weekly production:
5.2

Current finished stock:
1

Confirmed orders:
2

Recommended:
5 units

Explain WHY.

Do not implement fake ML personalization if insufficient data exists.

For early users use deterministic statistics.

As history accumulates, personalization can become stronger.

========================================================
18. FINANCIAL INSIGHTS
========================================================

Create useful, explainable insights.

Examples:

"You received ₹18,400 this month, 12% more than last month."

"Raw material represents 61% of your recorded business expenses this month."

"₹13,000 is currently pending from three buyers."

"Silk costs increased 8% compared with your previous four purchases."

"Patola generated the highest recorded contribution this month."

Never generate unsupported claims.

Every insight must trace back to actual records.

========================================================
19. AI FINANCE ASSISTANT
========================================================

Integrate Hisab into the existing SAATHI assistant.

Examples:

"How much did I earn this month?"

"Who owes me money?"

"How much did I spend on silk?"

"Did my income improve?"

"Can I afford material for five sarees?"

"Which buyer pays fastest?"

"How much do I owe suppliers?"

"Where did most of my money go?"

"How much cash is actually available?"

The assistant must query backend-derived financial summaries.

Do NOT send the entire raw ledger to Gemini unnecessarily.

Backend computes facts.

LLM explains them.

The LLM must never fabricate financial data.

If information is unavailable:

say so.

========================================================
20. MONTHLY HISAB
========================================================

Create monthly summaries.

Example:

JULY 2026

Money In
₹24,600

Money Out
₹11,200

Net Cash Movement
₹13,400

Sales Recorded
₹31,800

To Receive
₹7,200

To Pay
₹3,400

Business Expenses
₹10,400

Personal Withdrawals
₹800

Clearly distinguish:

sales/revenue
cash received
expenses
cash paid
outstanding balances

Do not label cash movement as profit.

========================================================
21. INCOME IMPROVEMENT
========================================================

Replace meaningless +0% indicators wherever appropriate with actual personal history once sufficient data exists.

Do NOT fake:

"SAATHI increased your income 14%."

Instead show:

Recent 3-month average:
₹13,100

Earlier baseline:
₹11,400

Change:
+14.9%

Label:

"Your recorded monthly income trend"

NOT:

"Income increased because of SAATHI"

unless causal evidence actually exists.

If insufficient history:

"Building your income history"

instead of:

+0%

This is important.

========================================================
22. REPORTS
========================================================

Provide:

Daily
Weekly
Monthly

and useful filters:

Money In
Money Out
Business
Personal
Buyer
Supplier
Category
Product
Payment method

Allow a simple printable/downloadable statement if consistent with existing project architecture.

Suggested monthly report:

Summary
Transactions
Money to Receive
Money to Pay
Expense Breakdown
Product Performance
Buyer Payments

Keep mobile presentation simple.

========================================================
23. SEARCH
========================================================

Hisab should be searchable.

Examples:

"Ramesh"

"silk"

"₹5000"

"July"

"transport"

Search across:

description
party
category
order
material

========================================================
24. EDIT / DELETE / CORRECTION
========================================================

Financial records need correction support.

Do not hard-delete confirmed financial history by default.

Prefer:

reversal/correction records

or maintain an audit trail.

At minimum store:

created_at
updated_at
source

and preserve enough information to explain modifications.

For prototype UX:

Edit

Delete/Reverse

Ask for confirmation.

========================================================
25. DUPLICATE PROTECTION
========================================================

Prevent duplicate transactions caused by:

double clicking
network retry
repeated order event
payment matching
refresh

Use idempotency where appropriate.

An order payment should not generate two financial records because the request was retried.

========================================================
26. DATABASE TRANSACTIONS
========================================================

Actions affecting multiple modules must be atomic.

Example:

Confirm material purchase

must either successfully:

create purchase
create financial transaction
update payable/cash
update inventory

OR fail as a whole.

Never leave:

Hisab says ₹6,000 spent
but inventory wasn't updated.

Use database transactions.

========================================================
27. PRIVACY
========================================================

Financial information is sensitive.

A weaver must only access their own financial records.

Do not expose another user's:

transactions
income
buyers
suppliers
cash
orders

Admin analytics should use aggregate information where possible.

Do not expose individual Hisab records to admin unless the existing product has a legitimate permission model for it.

========================================================
28. OFFLINE-READY DESIGN
========================================================

If the existing application architecture makes it feasible without destabilizing the prototype:

allow manual transaction capture while offline.

Queue locally with unique IDs.

Display:

Pending sync

When connection returns:

sync safely

avoid duplicates

resolve conflicts

Do not make offline functionality block the main Hisab implementation.

Core online functionality comes first.

========================================================
29. MULTILINGUAL SUPPORT
========================================================

EVERY user-visible Hisab string must support:

English
Hindi
Gujarati

Do not repeat the current problem where only headings translate and dynamic text remains English.

Use translation keys.

Dynamic alerts should be generated from structured codes + variables.

Example:

PAYMENT_OVERDUE

variables:

buyer_name
amount
days

Render translated frontend/backend templates.

Do not store only an English alert sentence.

Numbers remain numerically consistent.

Use Indian currency formatting:

₹1,250
₹12,400
₹1.24 lakh only where appropriate

For the weaver interface, prefer exact amounts for normal values.

========================================================
30. RESPONSIVE DESIGN
========================================================

Hisab must be designed MOBILE FIRST.

Test approximately:

360px
390px
430px

then tablet and desktop.

No horizontal scrolling.

No desktop grid squeezed into mobile.

Touch targets should be comfortable.

Money In
Money Out
Speak
Add Entry

should be obvious.

Use existing SAATHI visual identity.

Animations should be subtle and performant.

Respect reduced-motion preferences.

Do not redesign the global template.

========================================================
31. EMPTY STATES
========================================================

New user:

Do NOT show:

₹0
₹0
₹0
₹0
0% change

everywhere.

Instead:

Welcome to My Hisab

Start by recording your first payment or expense.

[+ Money In]

[- Money Out]

[🎤 Speak]

Explain:

"SAATHI will organize your records automatically as you use the app."

For income trends:

"Building your history"

For buyer intelligence:

"Buyer insights will appear after you record transactions."

========================================================
32. DASHBOARD HOME INTEGRATION
========================================================

Do NOT turn the main SAATHI Home into another finance dashboard.

Add a small financial summary.

Example:

MY HISAB

₹13,400
Net cash this month

₹7,800 to receive

1 payment needs attention

[Open Hisab]

If an urgent alert exists:

₹5,000 overdue by 7 days

[View]

Keep the primary weekly production recommendation dominant.

========================================================
33. FORECAST VS ACTUAL
========================================================

This distinction is critical.

Existing SAATHI has forecasted:

demand
cashflow
income

Hisab introduces ACTUAL:

sales
payments
expenses
cash
outstanding balances

Never silently mix them.

UI terminology:

Actual
Forecast

Example:

Actual income recorded this month:
₹13,400

Forecast:
₹14,800–₹16,200

Difference:
...

This creates a feedback loop for future model validation.

========================================================
34. BACKEND API
========================================================

Inspect existing FastAPI conventions before implementation.

Create REST endpoints consistent with the project.

Likely capabilities:

GET /api/hisab/summary

GET /api/hisab/transactions

POST /api/hisab/transactions

PATCH /api/hisab/transactions/{id}

POST /api/hisab/transactions/{id}/reverse

GET /api/hisab/receivables

GET /api/hisab/payables

GET /api/hisab/parties

GET /api/hisab/parties/{id}

GET /api/hisab/monthly

GET /api/hisab/insights

GET /api/hisab/alerts

POST /api/hisab/voice/parse

POST /api/hisab/payment-match

Do not blindly use these names if existing API architecture suggests a better convention.

Validate:

amount > 0

valid date

valid transaction type

ownership

order relationship

party relationship

payment cannot exceed valid remaining balance unless explicitly handled as advance/credit

========================================================
35. COMPUTATION LAYER
========================================================

Centralize calculations.

Do NOT calculate:

monthly income one way on Home
another way in Profile
another way in Hisab
another way in AI Assistant

Create reusable backend services for:

cash received
cash paid
net cash movement
sales
business expenses
personal withdrawals
receivables
payables
estimated contribution/profit
income trends
buyer metrics
supplier metrics

Backend should be authoritative.

Frontend renders results.

========================================================
36. MIGRATION / EXISTING DATA
========================================================

Do not destroy existing data.

Use safe database migration/initialization compatible with the current project.

Existing cluster forecast data must remain forecast data.

Do not convert cluster projections into personal financial history.

If there is no actual personal history:

start Hisab empty.

Optional demo/seed records may exist ONLY in explicit demo mode.

Never present seeded demo finances as the actual user's finances.

========================================================
37. ERROR HANDLING
========================================================

Do not display:

Failed to fetch

as the primary UX.

Use meaningful states:

Couldn't save this entry.
Your information has not been changed.

[Try Again]

For voice:

I couldn't understand the amount.

[Try Again]
[Enter Manually]

Manual entry must always remain available.

========================================================
38. TESTING
========================================================

Test at minimum:

manual income
manual expense
personal withdrawal
business expense
cash transaction
UPI transaction
credit purchase
partial buyer payment
full buyer payment
supplier payable
partial supplier payment
material purchase → inventory
order → receivable
order advance
overdue alert
monthly summary
business/personal separation
duplicate submission
edit/correction
multilingual strings
mobile layout
API failure
empty state

Verify arithmetic.

Financial arithmetic is not an area where "approximately works" is acceptable.

========================================================
39. DEMO SCENARIO
========================================================

Ensure this end-to-end scenario works reliably:

1. Weaver opens Hisab.

2. Dashboard shows their current financial state.

3. Weaver receives a ₹20,000 order.

4. Buyer pays ₹8,000 advance.

5. SAATHI automatically shows:

₹8,000 received
₹12,000 to receive

6. Weaver says:

"Aaje 6000 rupiya nu 10 kilo silk lidhu."

7. SAATHI parses:

₹6,000
Silk
10 kg
Raw Material
Business
Today

8. Weaver confirms.

9. Hisab updates expense.

10. Inventory gains 10 kg silk.

11. Monthly summary updates.

12. Buyer later pays ₹7,000.

13. Remaining receivable becomes:

₹5,000.

14. Due date passes.

15. Smart Alert:

₹5,000 from [buyer]
is overdue.

16. Buyer Intelligence incorporates payment behaviour.

17. Ask SAATHI:

"Who owes me money?"

Assistant answers using actual backend data.

18. Ask:

"How is my business doing this month?"

Assistant gives a concise factual summary.

This scenario should feel seamless.

========================================================
40. VISUAL DESIGN
========================================================

Follow the existing polished SAATHI UI.

Hisab should feel:

trustworthy
warm
simple
Indian
modern
financially serious

NOT:

banking dashboard
enterprise ERP
crypto application
generic SaaS admin panel

Use icons rather than emojis where icons are already used elsewhere.

Use cards sparingly.

Prioritize hierarchy and whitespace.

========================================================
41. DO NOT DO THESE
========================================================

Do not:

replace current forecasting system
remove existing features
change existing recommendation logic unnecessarily
invent financial history
invent buyer data
invent supplier data
pretend forecast cash is actual cash
silently save AI interpretations
require voice
require automation
remove manual entry
expose financial data across users
hardcode ₹ values
show fake income improvements
create opaque buyer trust scores
create fake AI personalization
break mobile UI
rewrite the whole backend merely to add Hisab

========================================================
42. IMPLEMENTATION STRATEGY
========================================================

Do this in phases internally.

PHASE A

Inspect codebase.

Map:

existing models
endpoints
orders
financial calculations
inventory
AI
translations
navigation
styles

PHASE B

Design data model and central financial service.

PHASE C

Implement database + APIs + tests.

PHASE D

Build Hisab dashboard and manual transactions.

PHASE E

Integrate Orders and payments.

PHASE F

Integrate material purchases/inventory.

PHASE G

Add receivables/payables and party khata.

PHASE H

Add alerts and buyer intelligence.

PHASE I

Add voice parsing + confirmation.

PHASE J

Integrate AI assistant.

PHASE K

Add reports, history and personal insights.

PHASE L

Mobile, translation, accessibility, error-state and regression testing.

IMPORTANT:

Do not stop after creating placeholder UI.

The core flows must work end-to-end.

========================================================
43. BEFORE CODING
========================================================

FIRST analyze the repository.

Then produce a concise implementation plan containing:

1. Existing files that will be modified
2. New files/modules required
3. Database schema changes
4. Existing financial logic that conflicts with Hisab
5. Integration points with Orders
6. Integration points with Inventory
7. Integration points with AI Assistant
8. Translation changes
9. Navigation changes
10. Risks of breaking current functionality

Then implement.

Do not ask me unnecessary questions if the answer can be inferred safely from the existing repository.

Preserve the working application.

========================================================
44. DEFINITION OF DONE
========================================================

Hisab is complete when a weaver can:

record money manually
record by voice
receive automatically generated records from SAATHI events
track sales
track expenses
separate personal/business money
track buyers
track suppliers
track partial payments
track money to receive
track money to pay
connect orders
connect material purchases
update inventory
see monthly financial position
see meaningful alerts
search history
correct mistakes
see buyer payment behaviour
ask the AI questions about actual finances
use the feature in Gujarati/Hindi/English
use it comfortably on a phone

AND

all financial numbers originate from consistent, traceable backend data.

The ultimate experience should be:

"I don't have to remember my Hisab anymore. SAATHI remembers it for me."

Build toward that experience.