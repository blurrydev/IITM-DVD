# **A Visual Study of E-Commerce Orders, Delivery & Customer Satisfaction** 

Team Working Document — Data Preparation & Exploratory Findings Data Visualization Design Project — May 2026 

_Status: Week 1–2 (Data Cleaning + EDA complete). Dashboard, final report and presentation still open._ 

## 1. Business Context & Goal 

We work for an online marketplace connecting many small sellers to customers across a large, geographically spread country. Leadership wants to grow the marketplace (more sellers, more sales) without sacrificing customer satisfaction. But there's a perceived tradeoff: better customer reviews seem to come from smaller, tighter operations, while growth requires on-boarding hundreds of smaller/riskier sellers and new categories.

Our job: trace the full order journey — placement, payment, seller handling, freight, delivery, and the final review — and identify what actually drives customer satisfaction and where the business should focus to grow sustainably.

**Headline answer (previewed here, detailed in Section 5): the growth-vs-quality tradeoff leadership assumes is not really about which sellers/categories to allow — it's a logistics execution problem. Delivery speed and reliability matter far more than seller reputation or product category. If we fix logistics, we can grow both volume and satisfaction.**

## 2. Dataset Overview 

The dataset (Olist e-commerce, Brazil) is split across 9 relational CSV files. No single file has everything — we had to join them together ourselves. Below is the map every team member should understand:

| **File** | **Grain (1 row =)** | **Key columns** |
|---|---|---|
| orders_dataset.csv | 1 order | order_id, customer_id, order_status, purchase/approval/delivery timestamps |
| order_items_dataset.csv | 1 item within an order | order_id, product_id, seller_id, price, freight_value |
| order_payments_dataset.csv | 1 payment record | order_id, payment_type, installments, payment_value |
| order_reviews_dataset.csv | 1 review | order_id, review_score, comment title/message |
| customers_dataset.csv | 1 customer | customer_id, customer_state, customer_city |
| sellers_dataset.csv | 1 seller | seller_id, seller_state, seller_city |
| products_dataset.csv | 1 product | product_id, product_category_name, weight/dimensions |
| product_category_name_translation.csv | 1 category | Portuguese → English category name |
| geolocation_dataset.csv | 1 zip code | lat/lng — used only if we build a map view |

#### **How they connect (join keys):**

- orders_dataset.order_id ↔ order_items / order_payments / order_reviews.order_id
- orders_dataset.customer_id ↔ customers_dataset.customer_id
- order_items_dataset.product_id ↔ products_dataset.product_id ↔ product_category_name_translation
- order_items_dataset.seller_id ↔ sellers_dataset.seller_id

Scope decision: we excluded the optional 'Marketing Funnel' dataset. Our core question (what drives satisfaction) is fully answerable from these 9 tables, and adding funnel data would add join complexity without changing the conclusions.

## 3. Data Cleaning & Preparation Process 

Full detail and runnable code is in 01_build_master_table.py (attached / in repo). This section documents every decision made and why, so any team member can explain it in the report or presentation.

### 3.1 Missing values found 

| **Field** | **% missing** | **Decision & reasoning** |
|---|---|---|
| review_comment_title / message | ~88% / ~59% | Expected — most customers leave a star rating without writing text. Not treated as a data quality issue; simply not used for text analysis. |
| order_delivered_customer_date | ~3% | Confirmed these are orders that were never delivered (status = shipped/canceled/unavailable/invoiced/processing), not data errors. Excluded from delivery-time calculations. |
| product_category_name (+ english) | ~1.9% of products | Left as 'unknown' category rather than dropped, so the orders aren't lost from other analyses. |
| 8 orders | status = 'delivered' but delivery date missing | Small, unexplained data glitch. Noted in the report as a limitation; left in place (excluded automatically from delivery-time calculations). |

### 3.2 Duplicate / multiplicity issues found 

- **order_reviews_dataset**: 551 orders had more than one review row (likely re-reviews or seller responses creating extra rows). Resolved by averaging review_score per order_id rather than picking one arbitrarily.

- **order_payments_dataset**: Orders can have multiple payment rows (e.g., voucher + credit card). Aggregated per order_id: summed payment_value, took the first payment_type, and the max installment count.

- **order_items_dataset**: Orders can contain multiple items (different products, sometimes different sellers). This is not an error — it's real structure — but it means item-level data had to be deliberated up to order level for consistency.

### 3.3 Grain decision: one row per order 

Because reviews and delivery info exist once per order but items can repeat, we chose ORDER as the unit of analysis. Item-level detail was aggregated up before merging, using these rules: 

- **n_items** = count of items in the order
- **total_price** = sum of item prices; **total_freight** = sum of freight costs
- **main_category** = category of the first item (orders are overwhelmingly single-category; a small minority are mixed, which we accept as a simplification)
- **main_seller_state** = state of the first seller; **n_sellers** = count of distinct sellers on the order (this became one of our most important variables — see Section 5.3)

### 3.4 Outlier check 

Max delivery_days observed was 209 days. We inspected the 5 slowest deliveries directly (timestamps, states, categories) and confirmed these are real dates, not corrupted data — genuine extreme service failures that damaged satisfaction.

## 4. Exploratory Data Analysis: Key Findings

### 4.1 Late Delivery vs Review Score

Orders delivered on time average **4.5 stars**; late deliveries average **3.0 stars**. This 1.5-point gap is enormous and consistent across all seller types and categories.

### 4.2 Review Score Drops Sharply After 25+ Day Deliveries

- 0–5 days: 4.43 stars
- 6–10 days: 4.35 stars
- 11–15 days: 4.25 stars
- 16–25 days: 3.98 stars
- 26+ days: 2.61 stars

The cliff is sharp after 25 days. This is the single strongest predictor of satisfaction.

### 4.3 Splitting Orders Across Sellers Hurts Satisfaction

- 1 seller: 4.12 stars
- 2 sellers: 2.88 stars
- 3 sellers: 2.35 stars
- 4+ sellers: 1.00 stars

Multi-seller orders almost never succeed. Likely cause: different sellers ship at different times, creating unpredictable delivery windows and coordination failures.

### 4.4 Product Categories: Some Are Inherently Problematic

Best performers: books (general & technical), food_drink
Worst performers: fixed_telephony, home_comfort, audio

However, the category effect is much smaller (~0.5 stars) compared to delivery timing (~1.5 stars).

### 4.5 Price and Freight: Weak Signals

- Total freight cost: weak negative correlation (-0.09 with review score)
- Total order price: very weak negative correlation (-0.04)

Higher prices don't inherently lower satisfaction if delivery is fast and reliable.

### 4.6 Installments: Mild Effect

Mild downward trend as installment count rises (4.14 for 1 installment down to 3.87 for 13+). Likely a proxy for higher-value/higher-stress purchases rather than a direct cause.

### 4.7 Correlation Check (Sanity Cross-Check)

| **Variable** | **Correlation with review_score** |
|---|---|
| delivery_days | -0.33 (moderate) |
| days_early_or_late | -0.27 (moderate) |
| total_freight | -0.09 (weak) |
| total_price | -0.04 (very weak) |

This confirms the delivery timing hypothesis quantitatively: delivery timing dominates every cost/price variable we tested.

### 4.8 Carrier Transit Delay vs Seller Handling Delay

Seller handling time (approval to shipment): average 4.26 days
Carrier transit time (shipment to delivery): average 4.17 days when on-time, but up to 33.5 days for late deliveries

**Conclusion**: Carrier delays hurt satisfaction far more than seller delays. The marketplace has more control over seller incentives than carrier networks, but the data shows carrier performance is the bottleneck.

### 4.9 Revenue Concentration

Top 1% of sellers generate ~40% of revenue. Top 10% generate ~80% of revenue. This means marketplace growth must rely on mid-tier sellers (not just the trusted few), which increases the pressure on logistics to scale uniformly.

### 4.10 Distance Drives Delivery Time

Orders shipped >1000 km average 17.25 days; orders <100 km average 2.0 days. Distance is a major driver of delivery time, and delivery time drives satisfaction. Geographic expansion will require solving logistics for longer distances.

### 4.11 Unhappy Customers Are Far More Likely to Write a Comment

- 1 star: 68% leave a comment
- 2 stars: 43%
- 3 stars: 36%
- 4 stars: 31%
- 5 stars: low %

This means we see feedback bias in the comment data — but star ratings are reliable.

### 4.12 Marketplace Order Volume Growth Over Time

Volume grew steadily from Sep 2016 through early 2018, then plateaued. Late-delivery rate spiked in March 2018 but then improved. No obvious external event explains this; would need logistics provider records to diagnose.

## 5. Summary of Limitations

- 551 orders had duplicate review rows, resolved by averaging.
- Extreme delivery delays (up to 209 days) were verified as real, not data errors, and intentionally kept rather than removed.
- Dataset covers Sep 2016 – Oct 2018 (Brazil) — findings reflect this market/period and may not generalize directly to other geographies or timeframes without validation.
- main_category / main_seller_state use the FIRST item in multi-item orders as a simplification — a small share of mixed-category orders may be mislabeled by this choice.
- distance_km uses zip-code-prefix centroids (median lat/lng of all geolocation points sharing a prefix), not exact addresses — a reasonable approximation but not precise, especially for large/rural areas.
- The March 2018 late-rate spike is flagged but not explained by this dataset alone — would need external context (e.g., logistics provider records) to confirm cause.
- seller_avg_score / seller_late_rate are computed across the full dataset period (2016–2018) — they describe historical seller performance, not necessarily current performance if used for real-time recommendations.

## 6. What's Left — Team Next Steps 

Per the project roadmap, Week 1–2 (data prep + EDA) is essentially done. Still open: 

| **Deliverable** | **Status** | **Suggested owner** |
|---|---|---|
| Interactive Marketplace Dashboard | Not started | TBD |
| Explanatory charts refined for presentation (from Section 4) | Draft versions exist | TBD |
| Final Presentation deck | Not started | TBD |
| Full Technical Report write-up | This document is the raw material | TBD |
| Individual contribution logs / work log | Not started — required per team structure rules | Everyone |

Attached alongside this document: `01_build_master_table.py`, `02_exploratory_analysis.py`, `03_feature_engineering.py`, `04_advanced_analysis.py`, `master_orders.csv`, `master_orders_enriched.csv`, and `insights_summary.txt`.
