# Demo Script

Target length: 2 to 3 minutes

## 1. Opening problem framing

"Handloom weavers deal with irregular income because demand is seasonal, payment cycles are delayed, and future orders are hard to see. Our product turns demand history into weekly production and cashflow guidance that is usable both on-screen and on paper."

## 2. Setup → Weaver view

1. Open the app and complete setup: name, state, cluster, and what they weave (or tap **Use demo: Patan Patola sarees**).
2. Say:

"The weaver chooses product and place up front. Home then answers one question: what should I weave this week, with a range they can act on. They can change the product anytime from the same card."

3. Point to the cash card and say:

"Cash status is a single traffic light plus income change and the next four weeks of expected cash-in — not a finance spreadsheet."

4. Open Forecast and say:

"Forecast leads with plain language — rising, steady, or softer — then the chart. Festival and this week's plan stay visible."

5. Click Print on Profile and say:

"This printable card matters because low-smartphone access is a real constraint."

## 3. Admin view

1. Switch to the Admin View.
2. Say:

"This view is for field officers and administrators. The forecast chart shows actual versus predicted demand, with the confidence band visible in the product itself. We wanted the uncertainty work to be inspectable, not buried in a notebook."

3. Point to the cashflow chart and say:

"Below that is the next four weeks of projected cash-in and net cashflow, with a live credit-need probability derived from the historical cashflow table."

4. Point to the metrics panel and say:

"These are real backtest metrics from the provided CSVs. On the test set, the ensemble reaches about 0.224 WAPE, beating the seasonal baseline at about 0.293, while 90 percent conformal intervals cover about 91.3 percent of actual outcomes."

## 4. Technical credibility close

"Under the hood, the stack uses a walk-forward time split, a seasonal-naive baseline, an XGBoost workhorse model with lag and exogenous features, a validation-weighted ensemble, and conformal prediction intervals. For payment friction, we documented that order-level payment delays and weekly receivable outstanding are related but separate estimators, so we use them for different parts of the cashflow logic rather than forcing a false reconciliation."

## 5. End close

"So the result is not just a forecasting model. It is a working product that converts demand signals into weekly production advice, cashflow risk visibility, and a printable field-ready artifact."
