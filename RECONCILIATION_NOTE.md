# Reconciliation Note

`orders_log.csv.payment_delay_days` and `weaver_cashflow_weekly.csv.receivable_weeks_outstanding` were generated independently and are not numerically interchangeable at the cluster-week grain.

Observed on this dataset:

- Cluster-week correlation between `receivable_weeks_outstanding` and mean `payment_delay_days` is about `-0.015`.
- Converting mean payment delay to weeks still leaves a mean absolute gap of about `2.19` weeks versus `receivable_weeks_outstanding`.
- Only about `16%` of cluster-weeks land within `1` week of each other after that conversion.

Decision for Phase 1:

- Use `orders_log.csv` as the source of the payment-delay distribution for forward cash timing.
- Use `weaver_cashflow_weekly.csv` as the source of weekly cost ratios, volatility, pending receivables, and historical credit-stress behavior.
- Treat both as complementary views of payment friction rather than forcing a false one-to-one reconciliation.

Why this is defensible in a judge Q&A:

- `payment_delay_days` is an order-level lag after payment due date.
- `receivable_weeks_outstanding` is a weekly balance-sheet style backlog measure derived from pending receivables versus recent revenue.
- Those are related concepts, but they live at different grains and answer different operational questions.
