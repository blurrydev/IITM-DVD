"""
E-Commerce Satisfaction Project — Step 1: Build Master Order Table
--------------------------------------------------------------------
Joins order_items, products, sellers, orders, reviews, payments, and
customers into a single order-level table for exploratory analysis.

Grain: one row per order.
- order_items are aggregated (n_items, total_price, total_freight, main_category)
- payments are aggregated (an order can have multiple payment rows)
- reviews are aggregated (551 orders had duplicate review rows — averaged)
"""

import pandas as pd

DATA_DIR = "data/"  # adjust if your CSVs live elsewhere

# ---- Load raw tables ----
order_items   = pd.read_csv(DATA_DIR + "order_items_dataset.csv")
products      = pd.read_csv(DATA_DIR + "products_dataset.csv")
cat_translation = pd.read_csv(DATA_DIR + "product_category_name_translation.csv")
sellers       = pd.read_csv(DATA_DIR + "sellers_dataset.csv")
orders        = pd.read_csv(DATA_DIR + "orders_dataset.csv", parse_dates=[
    "order_purchase_timestamp", "order_approved_at",
    "order_delivered_carrier_date", "order_delivered_customer_date",
    "order_estimated_delivery_date",
])
reviews       = pd.read_csv(DATA_DIR + "order_reviews_dataset.csv")
payments      = pd.read_csv(DATA_DIR + "order_payments_dataset.csv")
customers     = pd.read_csv(DATA_DIR + "customers_dataset.csv")

# ---- Step 1: item-level table with product category + seller state ----
products = products.merge(cat_translation, on="product_category_name", how="left")
items = order_items.merge(
    products[["product_id", "product_category_name_english"]], on="product_id", how="left"
)
items = items.merge(sellers[["seller_id", "seller_state"]], on="seller_id", how="left")

# ---- Step 2: collapse items to one row per order ----
order_summary = items.groupby("order_id").agg(
    n_items=("order_item_id", "count"),
    total_price=("price", "sum"),
    total_freight=("freight_value", "sum"),
    main_category=("product_category_name_english", "first"),
    main_seller_state=("seller_state", "first"),
    n_sellers=("seller_id", "nunique"),
).reset_index()

# ---- Step 3: aggregate payments (can be multiple rows per order) ----
pay_summary = payments.groupby("order_id").agg(
    total_payment=("payment_value", "sum"),
    payment_type=("payment_type", "first"),
    max_installments=("payment_installments", "max"),
).reset_index()

# ---- Step 4: aggregate reviews (551 orders had duplicate rows) ----
reviews_summary = reviews.groupby("order_id").agg(
    review_score=("review_score", "mean")
).reset_index()

# ---- Step 5: merge everything onto the order_summary spine ----
master = order_summary.merge(orders, on="order_id", how="left")
master = master.merge(reviews_summary, on="order_id", how="left")
master = master.merge(pay_summary, on="order_id", how="left")
master = master.merge(
    customers[["customer_id", "customer_state", "customer_city"]],
    on="customer_id", how="left"
)

# ---- Step 6: derived delivery variables ----
master["delivery_days"] = (
    master["order_delivered_customer_date"] - master["order_purchase_timestamp"]
).dt.days
master["days_early_or_late"] = (
    master["order_delivered_customer_date"] - master["order_estimated_delivery_date"]
).dt.days
master["is_late"] = master["days_early_or_late"] > 0

if __name__ == "__main__":
    print("Master table shape:", master.shape)
    print(master.head())
    master.to_csv(DATA_DIR + "master_orders.csv", index=False)
    print("Saved to", DATA_DIR + "master_orders.csv")
