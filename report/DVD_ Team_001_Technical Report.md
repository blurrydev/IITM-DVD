

<!-- Start of picture text -->
x» <<<br>— Oo<br>w G*<br>ea me<br>— —<br>z ~<br>a s,<br>4s &<br>GES<br><!-- End of picture text -->

# **Contents** 

Executive summary 

- 1 Business problem and decision questions 

- 2 Analytical approach and design rationale 

- 3 Data preparation and quality assurance 

- 4 Findings and visual evidence 

- 5 Dashboard design and chart selection 

- 6 Management implications and recommendations 

- 7 Constraints and next steps 

Technical appendix 

2 

# **Executive summary** 

The marketplace can grow its seller base and order volume only if the post-purchase experience remains reliable. This report examines whether low customer ratings are mainly associated with the sellers and products admitted to the marketplace, or with fulfilment after checkout. The evidence points to delivery execution as the priority: late orders average 2.27 stars compared with 4.23 for on-time orders, and ratings fall to 2.61 stars when delivery takes 25 days or more. 

The analysis uses a protected one-row-per-order dataset built from the Olist relational files. It follows the order journey from purchase to approval, seller handoff, carrier transit, delivery and review. The strongest actionable pattern is carrier transit, not seller handling: the average carrier stage is 8.9 days versus 2.3 days for seller handling, and satisfaction declines more steeply as carrier transit increases. Multi-seller orders are a second material source of dissatisfaction, while regional route conditions and a small group of high-value, low-scoring sellers identify where interventions should be targeted. 

Management should protect growth by reducing the long delivery tail rather than applying broad seller restrictions. The immediate operating plan is to trigger delivery exceptions from day 16, set realistic region-specific carrier SLAs, disclose split fulfilment at checkout, and provide dedicated remediation to the most commercially important at-risk sellers. 

# **1 Business problem and decision questions** 

## **1.1 Business problem in our words** 

The marketplace wants more sellers and more sales, but cannot allow expansion to reduce customer satisfaction. Management needs to know which parts of the order journey create low reviews, whether these problems can be fixed operationally, and how to intervene without unnecessarily reducing seller participation or commercial volume. 

## **1.2 Questions the analysis answers** 

- How strongly do delivery duration and late delivery affect review scores? 

- Is the satisfaction loss more closely associated with seller handling or carrier transit? 

- Do multi-seller orders create a separate fulfilment-complexity penalty? 

- Which regions, routes and sellers should receive priority intervention? 

- Do categories, price, payment, freight and geography alter the conclusion that fulfilment is the main operational lever? 

# **2 Analytical approach and design rationale** 

We treated the customer review as the final outcome of an order journey rather than as an isolated seller score. The analytical sequence was: understand the relational data, create a reliable orderlevel dataset, measure the core delivery outcomes, test plausible alternative explanations, and 

3 

translate the evidence into a dashboard and operating actions. This design prevents the project from becoming a collection of unrelated charts. 

|**Phase**|**Purpose**|**Business value**|
|---|---|---|
|Understand|Map source-table grain and define one order as the<br>unit of analysis.|Ensures each customer experience<br>receives one fair vote.|
|Prepare|Aggregate one-to-many tables before joining and<br>derive fulfilment metrics.|Prevents duplicate reviews and creates<br>comparable measures.|
|Explore|Compare ratings across delivery, delay, seller,<br>region and order-structure segments.|Identifies where dissatisfaction is<br>concentrated.|
|Communicate|Use decision-oriented charts and an interactive<br>dashboard.|Makes owner, priority and action clear to<br>management.|



## **2.1 Analytical logic** 

The primary hypothesis was that slower or late fulfilment lowers satisfaction. We then split the delivery journey into approval, seller handling and carrier transit to locate the responsible stage. We tested multi-seller fulfilment, geography, category, freight, payment and product characteristics as competing explanations. This is descriptive exploratory analysis, not a causal experiment; the findings are therefore used to prioritise operational investigation and intervention testing. 

# **3 Data preparation and quality assurance** 

## **3.1 Source data and analytical grain** 

The source is a relational marketplace dataset. Orders, items, payments and reviews do not have the same grain: one order can contain several items, payment records and review entries. The analytical dataset was deliberately built at one row per order because both delivery outcome and review score are experienced at order level. 

|**Source group**|**Role in analysis**|**Preparation rule**|
|---|---|---|
|Orders|Order status and lifecycle timestamps.|Used as the order-level spine.|
|Items and products|Item count, seller count, category, price<br>and freight.|Aggregated by order before joining.|
|Payments|Payment value, type and instalments.|Total payment summed; method retained as<br>a descriptor.|
|Reviews|Review score and comment availability.|Duplicate reviews averaged by order.|
|Customers, sellers and<br>geolocation|Customer state, seller state and route<br>context.|Joined after grain-safe aggregation.|



## **3.2 Cleaning and aggregation decisions** 

- Standardised identifiers, numeric fields and timestamps before any calculation. 

4 

- Excluded orders without item rows from fulfilment comparisons because seller and delivery measures cannot be meaningfully defined for them. This explains the difference between 99,441 raw orders and 98,666 master-order rows. 

- Averaged the 551 duplicated review records by order ID, preventing one order from receiving multiple votes in rating summaries. 

- Summed payment values and aggregated payment characteristics before joining, avoiding row multiplication from split payments. 

- Retained unusually long deliveries after validating the underlying timestamps; these are business-relevant service failures, not automatic data errors. 

- Flagged missing or logically impossible time intervals rather than interpreting them as operational performance. 

## **3.3 Derived variables and why they matter** 

|**Derived measure**|**Definition**|**Decision supported**|
|---|---|---|
|Delivery time|Customer delivery date minus purchase<br>timestamp.|Identifies the satisfaction threshold.|
|Late delivery|Actual delivery later than estimated delivery<br>date.|Measures promise reliability.|
|Seller handling|Carrier handoff minus approval date.|Separates merchant-stage delay.|
|Carrier transit|Customer delivery minus carrier handoff.|Separates transport-stage delay.|
|Distinct sellers|Number of sellers represented in an order.|Measures split-fulfilment complexity.|
|Seller risk|Seller-level order-value proxy, average score<br>and late rate.|Targets high-value remediation.|



# **4 Findings and visual evidence** 

## **4.1 Delivery time is the dominant satisfaction signal** 

Delivery duration has a clear non-linear relationship with satisfaction. Ratings remain above four stars through 15 days, worsen after 16 days, and collapse in the 25+ day group. The business implication is to prevent the extreme tail, not to spend resources shaving small increments from already fast deliveries. 

5 



<!-- Start of picture text -->
Review Score Drops Sharply After 25+ Day Deliveries<br>:<br>4.43 4.35 425<br>Aa 3.98<br>a<br>v<br>o<br>wn 3<br>> 2.61<br>vo<br>fe<br>eo 2<br>ce)<br>fe)<br>E<br>$ 1<br>Z<br>0<br>0-5d 6-10d 11-15d 16-25d 25d+<br>Delivery time<br><!-- End of picture text -->



<!-- Start of picture text -->
Late Delivery vs Review Score<br>5<br>in 4<br>ss<br>v<br>o 3<br>=<br>Vv<br>F s<br>= 2<br>wv<br>(2)<br>c<br>S<br>ql<br>0<br><!-- End of picture text -->

On-time 

Late 

Carrier Transit Delay Hurts Satisfaction Far More Than Seller Handling Delay 



<!-- Start of picture text -->
5 Seller Handling Time 5 Carrier Transit Time<br>4.26 4.17 411 4.35 4.28 4.16<br>4 3.80 4<br>g 3.29<br>a33<br>=<br>v2<br>><br>£2 2<br>2<br><<br>11<br>00<br>0-1d 2d 3-4d 5d+ 0-5d 6-10d 11-15d 15d+<br>: Splitting Orders Across Sellers Hurts Satisfaction<br>_ 4.12<br>i4<br>=<br>5<br>3 2.88<br>3 2.35<br>><br>eo 2<br>cD)<br>Dn<br>Ee<br>v 1.00<br>> 1<br>Z<br>0<br>1 4 | 4<br>Number of distinct sellers in order<br><!-- End of picture text -->



<!-- Start of picture text -->
Distance Drives Delivery Time, Which Drives Satisfaction 5<br>20.0<br>17.5 ——_———-——_—___.,,_, ee 4<br>Y 15.0 o<br>o °<br>TT 3 U<br>e s 12.5 :<br>$$<br>510.0 2<br>> 2 -<br>fe) [@))<br>£75 a<br>5.0 1<br>25<br>0.0 0<br>0-100km 100-500km 500-1k km 1k-2k km 2k+ km<br><!-- End of picture text -->



<!-- Start of picture text -->
Revenue Is Highly Concentrated Among Top Sellers<br>_<br>v 80<br>=<br>co)<br>><br>v<br>uw 60<br>fo}<br>i)<br>5 40<br>©<br>3<br>=<br>O 20<br>0<br>0) 20 40 60 80 100<br>% of sellers (ranked by revenue)<br><!-- End of picture text -->

Worst vs Best Product Categories by Review Score 

books_general_interest 

books technical food_drink 

luggage_accessories 



<!-- Start of picture text -->
food<br>bed_bath_table<br>fixed_telephony<br>home_confort<br>audio<br>office_furniture<br>0 1 2 3 4 5<br>Average review score (1-5)<br><!-- End of picture text -->







# **6 Management implications and recommendations** 

## **6.1 Prioritised action plan** 

|**Priorit**<br>**y**|**Action**|**Evidence**|**Owner and KPI**|
|---|---|---|---|
|1|Trigger carrier exceptions at day<br>16 and prevent orders reaching<br>25+ days.|Ratings collapse to 2.61 stars in the<br>25+ day band.|Carrier operations; 25+ day<br>share and late rate.|
|2|Use regional service promises<br>and carrier SLAs for long-<br>distance routes.|Long delivery and high late rates<br>cluster in remote regions.|Logistics planning; state-<br>level delivery days and late<br>rate.|
|3|Show split-delivery expectations<br>and tracking at checkout.|Two-seller orders average 2.88<br>versus 4.12 for one seller.|Marketplace product; multi-<br>seller rating gap.|
|4|Give high-value at-risk sellers<br>dedicated logistics support and<br>review monitoring.|Top 10% sellers account for 67.5%<br>of order value.|Merchant partnerships; seller<br>late rate and score.|
|5|Use category and complaint<br>themes for diagnosis after<br>fulfilment actions are underway.|Secondary patterns do not explain<br>the main satisfaction cliff.|Customer experience; issue-<br>theme trend.|



## **6.2 Recommended operating cadence** 

- Daily: flag carrier-transit exceptions approaching day 16 and trigger proactive customer communication. 

- Weekly: review late rate, 25+ day share, split-order rating gap and regional SLA performance. 

- Monthly: review the high-value seller risk quadrant and agree joint carrier-seller remediation actions. 

- Quarterly: evaluate whether interventions improve satisfaction while maintaining seller growth and order volume. 

## **6.3 Leadership decisions** 

Leadership should treat delivery reliability as a growth guardrail, not as a back-office logistics metric. The commercial objective is not simply to reduce average delivery time; it is to stop the small but damaging tail of orders that cross into the 25+ day experience. That tail produces disproportionately low ratings and visible complaint risk, so it should be managed as an exception portfolio with clear executive ownership. 

- Set one executive outcome: reduce the 25+ day share and late-delivery rate while holding seller growth and order volume steady. This prevents operational improvement from being pursued at the expense of marketplace expansion. 

12 

- Make carrier performance a commercial governance issue. Route-level SLAs, escalation thresholds and carrier scorecards should be reviewed with the same discipline as seller performance because carrier transit is the strongest satisfaction bottleneck. 

- Avoid blanket seller penalties. The top 10% of sellers represent 67.5% of order value, so indiscriminate removal of low-scoring sellers risks revenue. Use the risk quadrant to concentrate account management and logistics support where both satisfaction and commercial exposure are high. 

- Design for customer expectation, not only physical speed. For multi-seller carts, accurate splitpackage dates, proactive notifications and parcel-level tracking can reduce perceived failure even where multiple deliveries remain necessary. 

- Fund a fulfilment control tower. A recurring view of transit exceptions, regional SLA gaps, high-value seller risk and complaint themes will let leadership see emerging risk before it becomes a review-score problem. 

## **6.4 Leadership scorecard and decision gates** 

Leadership should not use average delivery time alone as the success measure. An average can improve while a small set of customers still experience the 25+ day service failure that causes the most damage. The scorecard should therefore combine customer outcome, operational reliability and commercial protection. Each monthly review should decide whether to scale an intervention, redesign it, or stop it based on these measures. 

|**Leadership measure**|**Why it matters**|**Decision gate**|
|---|---|---|
|25+ day delivery share|Directly monitors the satisfaction cliff, where<br>average rating falls to 2.61.|Escalate routes or carriers that do<br>not reduce the tail after intervention.|
|Late-delivery rate|Measures whether the platform keeps its<br>customer promise.|Hold carrier and route owners<br>accountable to agreed SLA targets.|
|On-time versus late<br>rating gap|Confirms whether reliability is still translating<br>into customer experience.|Investigate if the gap persists after<br>service recovery changes.|
|Multi-seller rating gap|Shows whether checkout communication reduces<br>split-fulfilment friction.|Scale parcel-level tracking if the gap<br>narrows without lower conversion.|
|Seller growth and order<br>volume|Prevents quality actions from harming<br>marketplace expansion.|Do not deploy blanket seller<br>restrictions if growth is put at risk.|
|High-value seller risk<br>count|Tracks the number of commercially material<br>sellers below the platform score benchmark.|Target account and logistics support<br>before punitive action.|



## **6.5 Recommended 90 day leadership roadmap** 

|**Timing**<br>Days 0 to 30|**Leadership commitment**<br>Nominate a fulfilment owner, publish the route and carrier<br>scorecard, and activate day-16 exception alerts.|**Expected learning**<br>Which carriers and routes<br>generate the avoidable long-<br>tail orders.|
|---|---|---|
|Days 31 to 60|Pilot regional SLA messages, proactive delay communication|Whether better expectation-|



13 

||and parcel-level tracking for multi-seller orders.|setting narrows the review-<br>score gap.|
|---|---|---|
|Days 61 to 90|Review the seller risk quadrant with merchant partnerships<br>and scale the best-performing carrier and checkout<br>interventions.|Which actions improve<br>satisfaction without slowing<br>seller and order growth.|



# **7 Constraints and next steps** 

This report is descriptive. Timing associations identify where to investigate and intervene, but do not prove that every low score was caused by the measured delay. Payment value is recorded at order level, so seller-level revenue is an analytical allocation proxy in multi-seller orders. Review comments are self-selected and any tagged complaint themes should be documented with the exact Portuguese keyword and classification rules. Future work should test interventions with beforeafter or controlled comparisons, add carrier-level identifiers where available, and monitor results over time. 

14 

# **Technical appendix** 

## **A Data preparation pseudocode** 

```
LOAD orders, order_items, payments, reviews, customers, sellers, products and
geography tables
```

```
STANDARDISE identifiers, numeric fields and timestamps; set one row per order_id as
the target grain
```

```
AGGREGATE items by order_id: n_items, n_sellers, price, freight and category
descriptors
AGGREGATE payments by order_id: total payment, payment method and maximum
instalments
AGGREGATE reviews by order_id: mean review score and comment-availability
indicator
```

```
JOIN aggregates to delivered orders; attach customer, seller, product and geographic
attributes
```

```
DERIVE delivery time, late flag, seller handling, carrier transit, seller-count and
delay buckets
```

```
VALIDATE duplicates, null rates, negative intervals, timestamp order and extreme
delivery durations
```

```
GROUP BY required segment for charts; calculate average score, order count and late-
delivery rate
```

```
PUBLISH grouped results to the dashboard and retain metric definitions beside each
visual
```

## **B Metric definitions** 

|**Metric**|**Formula or rule**|
|---|---|
|Average review score|Mean review score at the aggregated order level.|
|Delivery time|delivered_customer_date minus purchase_timestamp in days.|
|Late delivery|delivered_customer_date later than estimated_delivery_date.|
|Seller handling|carrier_handoff_date minus approved_date.|
|Carrier transit|delivered_customer_date minus carrier_handoff_date.|
|Late-delivery rate|late delivered orders divided by delivered orders in the segment.|



## **C Project artefacts** 

Interactive executive dashboard: https://dvd-project-fawn.vercel.app 

The dashboard is the interactive companion artefact for the fulfilment and customer-satisfaction analysis presented in this report. 

## **D Tools and project artefact management** 

|**Tool or platform**<br>Python scripts|**Use in the project**<br>Repeatable extraction, cleaning, aggregation,<br>feature engineering, checks and chart-ready<br>datasets.|**Submission role**<br>Provides the reproducible analytical<br>pipeline.|
|---|---|---|
|Kaggle notebooks|Interactive exploratory data analysis, visual testing<br>and documentation of findings.|Supports transparent EDA and<br>shareable analysis runs.|



15 

|LaTeX and Overleaf|Final typesetting, structured citations, equations and<br>submission-ready report compilation.|Provides an evaluator-ready PDF<br>workflow and a controlled report<br>source.|
|---|---|---|
|Microsoft Word|Collaborative drafting, review, editing and<br>stakeholder-facing documentation.|Supports document development<br>and formatting review before final<br>submission.|
|GitHub|Version-controlled codebase, work logs, notebook<br>history and dashboard source files.|Provides evaluator access to<br>reproducible code and contribution<br>history.|
|Google Drive|Shared source extracts, enriched dataset, figures and<br>supporting project documents.|Provides controlled sharing of large<br>data artefacts.|
|Browser<br>based<br>dashboard deployed<br>on Vercel|Interactive management dashboard with decision-<br>oriented visuals, filters and chart interactions.|Provides a live companion artefact<br>for evaluators and leadership.|



16 

