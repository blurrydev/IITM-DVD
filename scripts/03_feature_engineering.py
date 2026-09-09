"""
E-Commerce Satisfaction Project — Step 3: Feature Engineering
------------------------------------------------------------------
Builds on master_orders.csv (from 01_build_master_table.py).
Adds engineered features not present in the raw joined table:

  - Delivery time DECOMPOSED into 3 stages: approval lag, seller handling
    time, carrier transit time (instead of one lump "delivery_days")
  - product_weight_g, product_volume_cm3, product_photos_qty,
    product_description_length (from products_dataset)
  - customer-seller distance_km (haversine, using geolocation_dataset
    zip-prefix centroids)
  - seller-level aggregates merged back onto every order:
      seller_n_orders, seller_avg_score, seller_late_rate, seller_revenue
  - review_has_comment, review_comment_length (signal, not full NLP)
  - purchase_month, purchase_dow (for seasonality)

Output: master_orders_enriched.csv
"""

import pandas as pd
import numpy as np

DATA_DIR = "data/"

master = pd.read_csv(DATA_DIR + "master_orders.csv", parse_dates=[
    "order_purchase_timestamp", "order_approved_at",
    "order_delivered_carrier_date", "order_delivered_customer_date",
    "order_estimated_delivery_date",
])
products = pd.read_csv(DATA_DIR + "products_dataset.csv")
order_items = pd.read_csv(DATA_DIR + "order_items_dataset.csv")
sellers = pd.read_csv(DATA_DIR + "sellers_dataset.csv")
customers = pd.read_csv(DATA_DIR + "customers_dataset.csv")
geo = pd.read_csv(DATA_DIR + "geolocation_dataset.csv")
reviews = pd.read_csv(DATA_DIR + "order_reviews_dataset.csv")

# ---- 1. Decompose delivery time into 3 stages ----
master["approval_lag_hours"] = (
    master["order_approved_at"] - master["order_purchase_timestamp"]
).dt.total_seconds() / 3600
master["seller_handling_days"] = (
    master["order_delivered_carrier_date"] - master["order_approved_at"]
).dt.days
master["carrier_transit_days"] = (
    master["order_delivered_customer_date"] - master["order_delivered_carrier_date"]
).dt.days

# ---- 2. Product physical attributes (main item per order) ----
products["product_volume_cm3"] = (
    products["product_length_cm"] * products["product_height_cm"] * products["product_width_cm"]
)
main_item = order_items.sort_values("order_item_id").groupby("order_id").first().reset_index()
main_item = main_item.merge(
    products[["product_id", "product_weight_g", "product_volume_cm3",
              "product_photos_qty", "product_description_lenght"]],
    on="product_id", how="left"
)
master = master.merge(
    main_item[["order_id", "product_weight_g", "product_volume_cm3",
               "product_photos_qty", "product_description_lenght"]],
    on="order_id", how="left"
)

# ---- 3. Customer-seller geographic distance (haversine, zip-prefix centroids) ----
geo_avg = geo.groupby("geolocation_zip_code_prefix").agg(
    lat=("geolocation_lat", "median"), lng=("geolocation_lng", "median")
).reset_index()
cust_geo = customers.merge(
    geo_avg, left_on="customer_zip_code_prefix", right_on="geolocation_zip_code_prefix", how="left"
)[["customer_id", "lat", "lng"]].rename(columns={"lat": "cust_lat", "lng": "cust_lng"})
sell_geo = sellers.merge(
    geo_avg, left_on="seller_zip_code_prefix", right_on="geolocation_zip_code_prefix", how="left"
)[["seller_id", "lat", "lng"]].rename(columns={"lat": "seller_lat", "lng": "seller_lng"})
main_seller = order_items.sort_values("order_item_id").groupby("order_id")["seller_id"].first().reset_index()

master = master.merge(main_seller, on="order_id", how="left")
master = master.merge(cust_geo, on="customer_id", how="left")
master = master.merge(sell_geo, on="seller_id", how="left")

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))

master["distance_km"] = haversine(master["cust_lat"], master["cust_lng"], master["seller_lat"], master["seller_lng"])
master = master.drop(columns=["cust_lat", "cust_lng", "seller_lat", "seller_lng"])

# ---- 4. Seller-level performance aggregates, merged back onto each order ----
items_reviews = order_items.merge(
    master[["order_id", "review_score", "is_late"]], on="order_id", how="left"
)
seller_stats = items_reviews.groupby("seller_id").agg(
    seller_n_orders=("order_id", "nunique"),
    seller_revenue=("price", "sum"),
    seller_avg_score=("review_score", "mean"),
    seller_late_rate=("is_late", "mean"),
).reset_index()
master = master.merge(seller_stats, on="seller_id", how="left")

# ---- 5. Review text signals ----
reviews["review_has_comment"] = reviews["review_comment_message"].notna()
reviews["review_comment_length"] = reviews["review_comment_message"].fillna("").str.len()
review_text = reviews.groupby("order_id").agg(
    review_has_comment=("review_has_comment", "max"),
    review_comment_length=("review_comment_length", "max"),
).reset_index()
master = master.merge(review_text, on="order_id", how="left")

# ---- 6. Time features ----
master["purchase_month"] = master["order_purchase_timestamp"].dt.to_period("M").astype(str)
master["purchase_dow"] = master["order_purchase_timestamp"].dt.day_name()

if __name__ == "__main__":
    print("Enriched master shape:", master.shape)
    print("New columns added:", [c for c in master.columns if c not in pd.read_csv(DATA_DIR+'master_orders.csv', nrows=1).columns])
    master.to_csv(DATA_DIR + "master_orders_enriched.csv", index=False)
    print("Saved to", DATA_DIR + "master_orders_enriched.csv")
