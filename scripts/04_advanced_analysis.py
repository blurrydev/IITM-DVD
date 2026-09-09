"""
E-Commerce Satisfaction Project — Step 4: Advanced Analysis
------------------------------------------------------------------
Runs on master_orders_enriched.csv (from 03_feature_engineering.py).
Deeper questions beyond the initial EDA:
  1. Which delivery STAGE (approval / seller handling / carrier transit)
     matters most for satisfaction?
  2. How concentrated is seller revenue, and which high-volume sellers
     are dragging down satisfaction ("at-risk sellers")?
  3. Does customer-seller distance affect satisfaction directly, or only
     through delivery time?
  4. Do unhappy customers behave differently in review text?
  5. Are there time-based (seasonal / growth) patterns?
"""

import pandas as pd

m = pd.read_csv("data/master_orders_enriched.csv", parse_dates=["order_purchase_timestamp"])
delivered = m[m["order_status"] == "delivered"].copy()

# 1. Delivery stage decomposition
print("1. Avg score by seller_handling_days bucket")
delivered["sh_bucket"] = pd.cut(delivered["seller_handling_days"], bins=[-1, 1, 2, 4, 1000],
                                 labels=["0-1d", "2d", "3-4d", "5d+"])
print(delivered.groupby("sh_bucket")["review_score"].mean())

print("\n   Avg score by carrier_transit_days bucket")
delivered["ct_bucket"] = pd.cut(delivered["carrier_transit_days"], bins=[-1, 5, 10, 15, 1000],
                                 labels=["0-5d", "6-10d", "11-15d", "15d+"])
print(delivered.groupby("ct_bucket")["review_score"].mean())

print("\n   Correlation with review_score:")
print(delivered[["approval_lag_hours", "seller_handling_days", "carrier_transit_days",
                  "review_score"]].corr()["review_score"])

# 2. Seller concentration & at-risk sellers
seller_stats = m.drop_duplicates("seller_id")[
    ["seller_id", "seller_n_orders", "seller_revenue", "seller_avg_score", "seller_late_rate"]
].sort_values("seller_revenue", ascending=False).reset_index(drop=True)
total_rev = seller_stats["seller_revenue"].sum()
for pct in [1, 5, 10, 20]:
    n = max(1, int(len(seller_stats) * pct / 100))
    print(f"\n2. Top {pct}% of sellers generate "
          f"{seller_stats.iloc[:n]['seller_revenue'].sum()/total_rev*100:.1f}% of revenue")

overall_mean = m["review_score"].mean()
vol_threshold = seller_stats["seller_n_orders"].quantile(0.8)
at_risk = seller_stats[
    (seller_stats["seller_n_orders"] >= vol_threshold) &
    (seller_stats["seller_avg_score"] < overall_mean - 0.3)
].sort_values("seller_n_orders", ascending=False)
print(f"   {len(at_risk)} high-volume sellers score notably below average ({overall_mean-0.3:.2f})")
print(at_risk.head(10))

# 3. Distance: direct effect vs mediated-through-delivery-time effect
print("\n3. Correlation: distance_km vs delivery_days:", delivered["distance_km"].corr(delivered["delivery_days"]))
print("   Correlation: distance_km vs review_score (direct):", delivered["distance_km"].corr(delivered["review_score"]))

# 4. Review text behavior
reviews = pd.read_csv("data/order_reviews_dataset.csv")
reviews["has_comment"] = reviews["review_comment_message"].notna()
reviews["comment_length"] = reviews["review_comment_message"].fillna("").str.len()
print("\n4. % leaving a comment, by score:")
print(reviews.groupby("review_score")["has_comment"].mean() * 100)
print("   Avg comment length (chars) among commenters, by score:")
print(reviews[reviews["has_comment"]].groupby("review_score")["comment_length"].mean())

# 5. Seasonality
m["month"] = m["order_purchase_timestamp"].dt.to_period("M").astype(str)
m["dow"] = m["order_purchase_timestamp"].dt.day_name()
print("\n5. Monthly order volume (tail):")
print(m.groupby("month").size().tail(6))
print("   Avg review score by day of week:")
dow_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
print(m.groupby("dow")["review_score"].mean().reindex(dow_order))
print("   Late rate by month (tail):")
print(delivered.groupby(delivered["order_purchase_timestamp"].dt.to_period("M").astype(str))["is_late"].mean().tail(6))
