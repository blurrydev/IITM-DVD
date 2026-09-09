# **A Visual Study of E-Commerce Orders, Delivery & Customer Satisfaction** 

Team Working Document — Data Preparation & Exploratory Findings Data Visualization Design Project — May 2026 

_Status: Week 1–2 (Data Cleaning + EDA complete). Dashboard, final report and presentation still open._ 

## 1. Business Context & Goal 

We work for an online marketplace connecting many small sellers to customers across a large, geographically spread country. Leadership wants to grow the marketplace (more sellers, more sales) without damaging customer satisfaction. Aggressive seller onboarding raises sales but can raise late deliveries and bad reviews; strict quality control protects satisfaction but shrinks the catalogue and slows growth. Leadership currently makes this tradeoff on gut feel, not data. 

Our job: trace the full order journey — placement, payment, seller handling, freight, delivery, and the final review — and identify what actually drives customer satisfaction and where the business is quietly at risk. We need to tell leadership which categories, seller behaviours, regions and delivery patterns predict happy vs. unhappy customers, and where to invest vs. intervene. 

**Headline answer (previewed here, detailed in Section 5): the growth-vs-quality tradeoff leadership assumes is not really about which sellers/categories to allow — it's a logistics execution problem (delivery speed and order fragmentation).** 

## 2. Dataset Overview 

The dataset (Olist e-commerce, Brazil) is split across 9 relational CSV files. No single file has everything — we had to join them together ourselves. Below is the map every team member should understand before touching the data. 

|**File**|**Grain(1 row =)**|**Key columns**|
|---|---|---|
|orders_dataset.csv|1 order|order_id, customer_id, order_status,<br>purchase/approval/delivery timestamps|
|order_items_dataset.csv|1 item within an order|order_id, product_id, seller_id, price,<br>freight_value|
|order_payments_dataset.csv|1 payment record|order_id, payment_type, installments,<br>payment_value|
|order_reviews_dataset.csv|1 review|order_id, review_score, comment title/message|
|customers_dataset.csv|1customer|customer_id, customer_state, customer_city|
|sellers_dataset.csv|1 seller|seller_id, seller_state, seller_city|
|products_dataset.csv|1 product|product_id, product_category_name,<br>weight/dimensions|
|product_category_name_tran<br>slation.csv|1 category|Portuguese → English category name|
|geolocation_dataset.csv|1 zip code|lat/lng—used onlyifwe build amap view|



#### **How they connect (join keys):** 

- orders_dataset.order_id ↔ order_items / order_payments / order_reviews.order_id 

- orders_dataset.customer_id ↔ customers_dataset.customer_id 

- order_items_dataset.product_id ↔ products_dataset.product_id ↔ product_category_name_translation 

- order_items_dataset.seller_id ↔ sellers_dataset.seller_id 

Scope decision: we excluded the optional 'Marketing Funnel' dataset. Our core question (what drives satisfaction) is fully answerable from these 9 tables, and adding funnel data would add join complexity without adding to the satisfaction analysis. Revisit only if we finish core deliverables early. 

## 3. Data Cleaning & Preparation Process 

Full detail and runnable code is in 01_build_master_table.py (attached / in repo). This section documents every decision made and why, so any team member can explain it in the report or presentation. 

### 3.1 Missing values found 

|**Field**|**% missing**|**Decision & reasoning**|
|---|---|---|
|review_comment_title /<br>message|~88% / ~59%|Expected — most customers leave a star rating without<br>writing text. Not treated as a data quality issue; simply<br>not used for text analysis.|
|order_delivered_customer_d<br>ate|~3%|Confirmed these are orders that were never delivered<br>(status =<br>shipped/canceled/unavailable/invoiced/processing), not<br>data errors. Excluded from delivery-time calculations;<br>keptinthe tableforstatus-levelanalysis.|
|product_category_name (+<br>english)|~1.9% of<br>products|Left as 'unknown' category rather than dropped, so the<br>orders aren'tlostfromotheranalyses.|
|8 orders|status =<br>'delivered' but<br>delivery date<br>missing|Small, unexplained data glitch. Noted in the report as a<br>limitation; left in place (excluded automatically from<br>delivery-time calcs since the date is null).|



### 3.2 Duplicate / multiplicity issues found 

- order_reviews_dataset: 551 orders had more than one review row (likely re-reviews or seller responses creating extra rows). Resolved by averaging review_score per order_id rather than picking one arbitrarily or duplicating the order. 

- order_payments_dataset: orders can have multiple payment rows (e.g., voucher + credit card). Aggregated per order_id: summed payment_value, took the first payment_type, and the max installment count. 

- order_items_dataset: orders can contain multiple items (different products, sometimes different sellers). This is not an error — it's real structure — but it means item-level data had to be deliberately aggregated to one row per order (see 3.3) rather than merged directly, which would have silently multiplied review scores across items. 

### 3.3 Grain decision: one row per order 

Because reviews and delivery info exist once per order but items can repeat, we chose ORDER as the unit of analysis. Item-level detail was aggregated up before merging, using these rules: 

- n_items = count of items in the order 

- total_price = sum of item prices; total_freight = sum of freight costs 

- main_category = category of the first item (orders are overwhelmingly single-category; a small minority are mixed, which we accept as a simplification) 

- main_seller_state = state of the first seller; n_sellers = count of distinct sellers on the order (this became one of our most important variables — see Section 5.3) 

### 3.4 Outlier check 

Max delivery_days observed was 209 days. We inspected the 5 slowest deliveries directly (timestamps, states, categories) and confirmed these are real dates, not corrupted data — genuine extreme service failures. Decision: kept in the dataset rather than removed, since deleting them would hide a real risk signal leadership needs to see. To prevent them from distorting simple averages, we report medians alongside means and bucket delivery time into ranges (see Section 5.2) instead of relying on a single average. 



<!-- Start of picture text -->
Late Delivery vs Review Score<br>in 4<br>sh<br>5<br>9 3<br>=<br>0<br>><br>£2<br>cd)<br>io)<br>£<br>$<br><i<br>0<br>On-time Late<br><!-- End of picture text -->





<!-- Start of picture text -->
Review Score Drops Sharply After 25+ Day Deliveries<br>'<br>4.43 4.35 4.25<br>fe) 4 3.98<br>=<br>v<br>2<br>wn 3<br>> 2.61<br>wv<br>><br>22<br>o<br>fo)<br>2<br>o<br>gl<br>0<br>0-5d 6-10d 11-15d 16-25d 25d+<br>Delivery time<br><!-- End of picture text -->



<!-- Start of picture text -->
' Splitting Orders Across Sellers Hurts Satisfaction<br>= 4.12<br>m4<br>=<br>v<br>2 3 2.88<br>a 2.35<br>><br>22<br>o<br>nD<br>2<br>glo 1.00<br>0<br>1 2 3 4<br>Number of distinct sellers in order<br><!-- End of picture text -->



<!-- Start of picture text -->
Worst vs Best Product Categories by Review Score<br>books_general_interest<br>books_technical<br>food_drink<br>luggage_accessories<br>food<br>bed_bath_table<br>fixed_telephony<br>home_confort<br>audio<br>office_furniture<br>0 1 2 3 4 5<br>Average review score (1-5)<br><!-- End of picture text -->

- Installments: mild downward trend as installment count rises (4.14 for 1 installment down to 3.87 for 13+), likely a proxy for higher-value / higher-stress purchases rather than a direct cause. 

- 5.7 Correlation check (sanity cross-check across all numeric factors) 

Correlation of each variable with review_score, across all orders (closer to 0 = weaker relationship, negative = higher value associated with lower score): 

|**Variable**|**Correlation with review_score**|
|---|---|
|delivery_days|-0.33 (moderate)|
|days_early_or_late|-0.27 (moderate)|
|total_freight|-0.09 (weak)|
|total_price|-0.04(very weak)|



This confirms Sections 5.1–5.2 quantitatively: delivery timing dominates every cost/price variable we tested. 





<!-- Start of picture text -->
Carrier Transit Delay Hurts Satisfaction Far More Than Seller Handling Delay<br>5 Seller Handling Time 5 Carrier Transit Time<br>4.26 4.17 411 335 4.28 4,16<br>4 3.80 4<br>i}5 3.29<br>a33<br>=<br>2<br>o<br>:<br><<br>11<br>0 0<br>0-1d 2d 3-4d 5d+ 0-5d 6-10d 11-15d 15d+<br><!-- End of picture text -->



<!-- Start of picture text -->
Revenue Is Highly Concentrated Among Top Sellers<br>=<br>Y 80<br>=<br>co)<br>><br>v<br>« 60<br>°<br>cv)<br>& 40<br>&<br>=|<br>5<br>O 20<br>0<br>0 20 40 60 80 100<br>% of sellers (ranked by revenue)<br><!-- End of picture text -->





<!-- Start of picture text -->
Distance Drives Delivery Time, Which Drives Satisfaction :<br>20.0<br>1725 ————————__ 2 — 4<br>2 15.0 v<br>© °<br>52) 3 Vv<br>> 12.5 :<br>$v<br>=<br>ToT 10.0 2 =3<br>212) 75 4Lor)<br>5.0 1<br>2.5<br>0.0 0)<br>0-100km 100-500km 500-1kkm = 1k-2k km 2k+ km<br><!-- End of picture text -->



<!-- Start of picture text -->
Unhappy Customers Are Far More Likely to Write a Comment<br>_ 80 %<br>o<br>& 70 68%<br>5<br>o 60<br>Cc<br>ov<br>£50<br>5 43%<br>& 40 36%<br>x 31%<br>= 30<br>4]<br>a<br>= 20<br>2<br>‘5 10<br>x<br>0<br>1 2 3 4 5<br>Review score (stars)<br><!-- End of picture text -->





<!-- Start of picture text -->
Marketplace Order Volume Growth Over Time<br>7000<br>6000<br>x=<br>y<br>S<br>E 5000<br>o<br>a 4000<br>2<br>%—_ 3000<br>fo)<br>2000<br>1000<br>YF 9 FF FF PPPS eH YX PF YG F §<br>N NN N NL NK N N NR NR N N B@ B@ BB B@ GB GB GB w<br>SPTYY KPYF FT eKFY FY PKFT KKFY FY FXKg s— FFNS FY FFTsYF YF FT syFF FFY F&<br><!-- End of picture text -->

- 551 orders had duplicate review rows, resolved by averaging. 

- Extreme delivery delays (up to 209 days) were verified as real, not data errors, and intentionally kept rather than removed. 

- Dataset covers Sep 2016 – Oct 2018 (Brazil) — findings reflect this market/period and may not generalize directly to other geographies or timeframes without validation. 

- main_category / main_seller_state use the FIRST item in multi-item orders as a simplification — a small share of mixed-category orders may be mislabeled by this choice. 

- distance_km uses zip-code-prefix centroids (median lat/lng of all geolocation points sharing a prefix), not exact addresses — a reasonable approximation but not precise, especially for large/rural zip prefixes. 

- The March 2018 late-rate spike is flagged but not explained by this dataset alone — would need external context (e.g. logistics provider records) to confirm cause. 

- seller_avg_score / seller_late_rate are computed across the full dataset period (2016–2018) — they describe historical seller performance, not necessarily current performance if used for real-time decisions. 

## 9. What's Left — Team Next Steps 

Per the project roadmap, Week 1–2 (data prep + EDA) is essentially done. Still open: 

|**Deliverable**|**Status**|**Suggested owner**|
|---|---|---|
|InteractiveMarketplaceDashboard|Not started|TBD|
|Explanatory charts refined for<br>presentation(fromSection5)|Draft versions exist|TBD|
|Final Presentation deck|Not started|TBD|
|Full Technical Report write-up|This document is the raw<br>material|TBD|
|Individual contribution logs / work log|Not started — required per<br>team structure rules|Everyone|



Attached alongside this document: 01_build_master_table.py, 02_exploratory_analysis.py, 03_feature_engineering.py, 04_advanced_analysis.py, master_orders.csv, master_orders_enriched.csv, and insights_summary.md — everything here is reproducible from those files. 

