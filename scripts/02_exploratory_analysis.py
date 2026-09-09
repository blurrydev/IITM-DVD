"""
E-Commerce Satisfaction Project — Step 2: Exploratory Analysis
------------------------------------------------------------------
Runs on master_orders.csv (built by 01_build_master_table.py).
Answers: what drives review_score up or down?
"""

import pandas as pd

master = pd.read_csv("data/master_orders.csv", parse_dates=[
    "order_purchase_timestamp", "order_delivered_customer_date"
])
delivered = master[master["order_status"] == "delivered"].copy()

# 1. Late vs on-time
print("1. Review score: on-time vs late")
print(master.groupby("is_late")["review_score"].agg(["mean", "count"]))

# 2. Delivery speed buckets
delivered["delivery_bucket"] = pd.cut(
    delivered["delivery_days"], bins=[-1, 5, 10, 15, 25, 1000],
    labels=["0-5d", "6-10d", "11-15d", "16-25d", "25d+"]
)
print("\n2. Review score by delivery speed")
print(delivered.groupby("delivery_bucket")["review_score"].mean())
delivered["is_1star"] = delivered["review_score"] == 1
print("\n   % 1-star by delivery speed")
print(delivered.groupby("delivery_bucket")["is_1star"].mean() * 100)

# 3. Category (min 200 orders)
cat_stats = master.groupby("main_category").agg(
    avg_score=("review_score", "mean"), n=("review_score", "count")
)
cat_stats = cat_stats[cat_stats["n"] >= 200].sort_values("avg_score")
print("\n3. Worst / best categories by review score")
print(cat_stats.head(8), "\n", cat_stats.tail(8))

# 4. Customer state (min 300 delivered orders)
state_stats = delivered.groupby("customer_state").agg(
    avg_score=("review_score", "mean"),
    late_rate=("is_late", "mean"),
    avg_delivery_days=("delivery_days", "mean"),
    n=("review_score", "count"),
).sort_values("avg_score")
state_stats = state_stats[state_stats["n"] >= 300]
print("\n4. Worst states by review score")
print(state_stats.head(10))

# 5. Same-state seller/customer pairing
master["same_state"] = master["main_seller_state"] == master["customer_state"]
print("\n5. Review score: same-state vs cross-state seller/customer")
print(master.groupby("same_state")["review_score"].agg(["mean", "count"]))

# 6. Number of sellers per order
print("\n6. Review score by number of distinct sellers in the order")
print(master.groupby("n_sellers")["review_score"].agg(["mean", "count"]))

# 7. Freight ratio
master["freight_ratio"] = master["total_freight"] / master["total_price"].replace(0, pd.NA)
master["high_freight"] = master["freight_ratio"] > 0.3
print("\n7. Review score: high vs low freight-to-price ratio")
print(master.groupby("high_freight")["review_score"].agg(["mean", "count"]))
