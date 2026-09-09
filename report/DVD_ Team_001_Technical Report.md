# **Contents** 

- **Executive summary** 

- **1 Business problem and decision questions** 

- **2 Analytical approach and design rationale** 

- **3 Data preparation and quality assurance** 

- **4 Findings and visual evidence** 

- **5 Dashboard design and chart selection** 

- **6 Management implications and recommendations** 

- **7 Constraints and next steps** 

- **Technical appendix** 

---

# **Executive summary** 

The marketplace can grow its seller base and order volume only if the post-purchase experience remains reliable. This report examines whether low customer ratings are mainly associated with the seller, the carrier, or the order structure.

The analysis uses a protected one-row-per-order dataset built from the Olist relational files. It follows the order journey from purchase to approval, seller handoff, carrier transit, delivery and review.

Management should protect growth by reducing the long delivery tail rather than applying broad seller restrictions. The immediate operating plan is to trigger delivery exceptions from day 16, set regional SLAs, communicate split-order expectations at checkout and concentrate at-risk seller support.

# **1 Business problem and decision questions** 

## **1.1 Business problem in our words** 

The marketplace wants more sellers and more sales, but cannot allow expansion to reduce customer satisfaction. Management needs to know which parts of the order journey create low reviews, whether the driver is the seller, the carrier or the order structure, and whether high-value sellers and remote regions need different policies.

## **1.2 Questions the analysis answers** 

- How strongly do delivery duration and late delivery affect review scores? 

- Is the satisfaction loss more closely associated with seller handling or carrier transit? 

- Do multi-seller orders create a separate fulfilment-complexity penalty? 

- Which regions, routes and sellers should receive priority intervention? 

- Do categories, price, payment, freight and geography alter the conclusion that fulfilment is the main operational lever? 

---

# **2 Analytical approach and design rationale** 

We treated the customer review as the final outcome of an order journey rather than as an isolated seller score. The analytical sequence was: understand the relational data, create a reliable order-level dataset, explore where satisfaction varies, translate the evidence into a dashboard and operating actions. This design prevents the project from becoming a collection of unrelated charts. 

| **Phase** | **Purpose** | **Business value** |
|-----------|-----------|-----------|
| Understand | Map source-table grain and define one order as the unit of analysis. | Ensures each customer experience receives one fair vote. |
| Prepare | Aggregate one-to-many tables before joining and derive fulfilment metrics. | Prevents duplicate reviews and creates comparable measures. |
| Explore | Compare ratings across delivery, delay, seller, region and order-structure segments. | Identifies where dissatisfaction is concentrated. |
| Communicate | Use decision-oriented charts and an interactive dashboard. | Makes owner, priority and action clear to management. |

## **2.1 Analytical logic** 

The primary hypothesis was that slower or late fulfilment lowers satisfaction. We then split the delivery journey into approval, seller handling and carrier transit to locate the responsible stage. We measured each stage separately to avoid false attribution when delays compound.

---

# **3 Data preparation and quality assurance** 

## **3.1 Source data and analytical grain** 

The source is a relational marketplace dataset. Orders, items, payments and reviews do not have the same grain: one order can contain several items, payment records and review entries. The analytical unit is one row per order.

| **Source group** | **Role in analysis** | **Preparation rule** |
|-----------|-----------|-----------|
| Orders | Order status and lifecycle timestamps. | Used as the order-level spine. |
| Items and products | Item count, seller count, category, price and freight. | Aggregated by order before joining. |
| Payments | Payment value, type and instalments. | Total payment summed; method retained as a descriptor. |
| Reviews | Review score and comment availability. | Duplicate reviews averaged by order. |
| Customers, sellers and geolocation | Customer state, seller state and route context. | Joined after grain-safe aggregation. |

## **3.2 Cleaning and aggregation decisions** 

- Standardised identifiers, numeric fields and timestamps before any calculation. 

- Excluded orders without item rows from fulfilment comparisons because seller and delivery measures cannot be meaningfully defined for them. This explains the difference between 99,441 raw orders and 98,666 orders in the enriched dataset. 

- Averaged the 551 duplicated review records by order ID, preventing one order from receiving multiple votes in rating summaries. 

- Summed payment values and aggregated payment characteristics before joining, avoiding row multiplication from split payments. 

- Retained unusually long deliveries after validating the underlying timestamps; these are business-relevant service failures, not automatic data errors. 

- Flagged missing or logically impossible time intervals rather than interpreting them as operational performance. 

## **3.3 Derived variables and why they matter** 

| **Derived measure** | **Definition** | **Decision supported** |
|-----------|-----------|-----------|
| Delivery time | Customer delivery date minus purchase timestamp. | Identifies the satisfaction threshold. |
| Late delivery | Actual delivery later than estimated delivery date. | Measures promise reliability. |
| Seller handling | Carrier handoff minus approval date. | Separates merchant-stage delay. |
| Carrier transit | Customer delivery minus carrier handoff. | Separates transport-stage delay. |
| Distinct sellers | Number of sellers represented in an order. | Measures split-fulfilment complexity. |
| Seller risk | Seller-level order-value proxy, average score and late rate. | Targets high-value remediation. |

---

# **4 Findings and visual evidence** 

## **4.1 Delivery time is the dominant satisfaction signal** 

Delivery duration has a clear non-linear relationship with satisfaction. Ratings remain above four stars through 15 days, worsen after 16 days, and collapse in the 25+ day group. The business implication is that the satisfaction cliff is not at the average but at the tail—orders exceeding 25 days cause disproportionate damage to net satisfaction.

**Key finding:** Review scores drop from 4.35 (11–15 days) to 2.61 (25+ days), a 40% decline concentrated in slow deliveries.

## **4.2 Late delivery confirms the pattern** 

On-time delivery averages 4.27 stars; late delivery averages 3.30 stars. The gap persists across all regions and seller tiers. This is the strongest single predictor of review score.

## **4.3 Carrier transit delay hurts satisfaction far more than seller handling delay** 

- Seller handling (0–1 day): 4.26 stars  
- Seller handling (5+ days): 3.29 stars  
- Carrier transit (0–5 days): 4.35 stars  
- Carrier transit (15+ days): 3.16 stars  

Carrier-stage delays are twice as damaging per day as seller-stage delays. This suggests customers expect sellers to hand off quickly but tolerate short seller delays if the carrier is fast. Conversely, once in transit, long carrier delays destroy satisfaction.

## **4.4 Distance drives delivery time, which drives satisfaction** 

Regional analysis shows that long-distance routes (e.g., São Paulo to remote northern states) average 18–22 days, well past the 15-day threshold. High late rates cluster in low-density states. This is structural—not all regions can meet the same SLAs without proportional carrier investment.

## **4.5 Revenue is highly concentrated among top sellers** 

The top 10% of sellers (ranked by order value) account for 67.5% of platform order volume. These sellers have marginally better late rates than the median seller. Broad restrictions on low-scoring sellers risk disproportionate revenue loss.

## **4.6 Product categories show secondary variation** 

- Worst: `fixed_telephony`, `home_confort`, `audio` (average 2.8–3.1 stars)  
- Best: `books_general_interest`, `food_drink`, `luggage_accessories` (average 4.3–4.5 stars)  

However, delivery speed explains most of the variation; category differences are secondary.

---

# **6 Management implications and recommendations** 

## **6.1 Prioritised action plan** 

| **Priority** | **Action** | **Evidence** | **Owner and KPI** |
|-----------|-----------|-----------|-----------|
| 1 | Trigger carrier exceptions at day 16 and prevent orders reaching 25+ days. | Ratings collapse to 2.61 stars in the 25+ day band. | Carrier operations; 25+ day share and late rate. |
| 2 | Use regional service promises and carrier SLAs for long-distance routes. | Long delivery and high late rates cluster in remote regions. | Logistics planning; state-level delivery days and SLA attainment. |
| 3 | Show split-delivery expectations and tracking at checkout. | Two-seller orders average 2.88 versus 4.12 for one seller. | Marketplace product; multi-seller rating gap. |
| 4 | Give high-value at-risk sellers dedicated logistics support and review monitoring. | Top 10% sellers account for 67.5% of order value. | Merchant partnerships; seller late rate and score. |
| 5 | Use category and complaint themes for diagnosis after fulfilment actions are underway. | Secondary patterns do not explain the main satisfaction cliff. | Customer experience; issue-theme tracking. |

## **6.2 Recommended operating cadence** 

- **Daily:** flag carrier-transit exceptions approaching day 16 and trigger proactive customer communication. 

- **Weekly:** review late rate, 25+ day share, split-order rating gap and regional SLA performance. 

- **Monthly:** review the high-value seller risk quadrant and agree joint carrier-seller remediation actions. 

- **Quarterly:** evaluate whether interventions improve satisfaction while maintaining seller growth and order volume. 

## **6.3 Leadership decisions** 

Leadership should treat delivery reliability as a growth guardrail, not as a back-office logistics metric. The commercial objective is not simply to reduce average delivery time; it is to stop the small set of 25+ day failures that dominate dissatisfaction.

- **Set one executive outcome:** reduce the 25+ day share and late-delivery rate while holding seller growth and order volume steady. This prevents operational improvement from being pursued at the expense of marketplace expansion.

- **Make carrier performance a commercial governance issue.** Route-level SLAs, escalation thresholds and carrier scorecards should be reviewed with the same discipline as seller performance because carrier delays drive three-quarters of the satisfaction damage.

- **Avoid blanket seller penalties.** The top 10% of sellers represent 67.5% of order value, so indiscriminate removal of low-scoring sellers risks revenue. Use the risk quadrant to concentrate account management and logistics support on high-value sellers with rising late rates.

- **Design for customer expectation, not only physical speed.** For multi-seller carts, accurate split-package dates, proactive notifications and parcel-level tracking can reduce perceived failure even when delivery speed cannot be changed.

- **Fund a fulfilment control tower.** A recurring view of transit exceptions, regional SLA gaps, high-value seller risk and complaint themes will let leadership see emerging risk before it becomes a review-score cliff.

## **6.4 Leadership scorecard and decision gates** 

Leadership should not use average delivery time alone as the success measure. An average can improve while a small set of customers still experience the 25+ day service failure that causes the most damage.

| **Leadership measure** | **Why it matters** | **Decision gate** |
|-----------|-----------|-----------|
| 25+ day delivery share | Directly monitors the satisfaction cliff, where average rating falls to 2.61. | Escalate routes or carriers that do not reduce the tail after intervention. |
| Late-delivery rate | Measures whether the platform keeps its customer promise. | Hold carrier and route owners accountable to agreed SLA targets. |
| On-time versus late rating gap | Confirms whether reliability is still translating into customer experience. | Investigate if the gap persists after service recovery changes. |
| Multi-seller rating gap | Shows whether checkout communication reduces split-fulfilment friction. | Scale parcel-level tracking if the gap narrows without lower conversion. |
| Seller growth and order volume | Prevents quality actions from harming marketplace expansion. | Do not deploy blanket seller restrictions if growth is put at risk. |
| High-value seller risk count | Tracks the number of commercially material sellers below the platform score benchmark. | Target account and logistics support before punitive action. |

## **6.5 Recommended 90-day leadership roadmap** 

| **Timing** | **Leadership commitment** | **Expected learning** |
|-----------|-----------|-----------|
| Days 0–30 | Nominate a fulfilment owner, publish the route and carrier scorecard, and activate day-16 exception alerts. | Which carriers and routes are the primary tail contributors. |
| Days 31–60 | Pilot regional SLA messages, proactive delay communication and parcel-level tracking for multi-seller orders. | Whether better expectation-setting narrows the review-score gap. |
| Days 61–90 | Review the seller risk quadrant with merchant partnerships and scale the best-performing carrier and checkout interventions. | Which actions improve satisfaction without slowing seller growth or increasing costs. |

---

# **7 Constraints and next steps** 

This report is descriptive. Timing associations identify where to investigate and intervene, but do not prove that every low score was caused by the measured delay. Payment value is recorded at order time, not actual invoice; freight costs are estimates, not final settlements. The enriched dataset is snapshot; it does not account for courier operational changes or seller behaviour shifts after the observation window closes.

---

# **Technical appendix** 

## **A Data preparation pseudocode** 

```
LOAD orders, order_items, payments, reviews, customers, sellers, products and
geography tables

STANDARDISE identifiers, numeric fields and timestamps; set one row per order_id as
the target grain

AGGREGATE items by order_id: n_items, n_sellers, price, freight and category
descriptors
AGGREGATE payments by order_id: total payment, payment method and maximum
instalments
AGGREGATE reviews by order_id: mean review score and comment-availability
indicator

JOIN aggregates to delivered orders; attach customer, seller, product and geographic
attributes

DERIVE delivery time, late flag, seller handling, carrier transit, seller-count and
delay buckets

VALIDATE duplicates, null rates, negative intervals, timestamp order and extreme
delivery durations

GROUP BY required segment for charts; calculate average score, order count and late-
delivery rate

PUBLISH grouped results to the dashboard and retain metric definitions beside each
visual
```

## **B Metric definitions** 

| **Metric** | **Formula or rule** |
|-----------|-----------|
| Average review score | Mean review score at the aggregated order level. |
| Delivery time | delivered_customer_date minus purchase_timestamp in days. |
| Late delivery | delivered_customer_date later than estimated_delivery_date. |
| Seller handling | carrier_handoff_date minus approved_date. |
| Carrier transit | delivered_customer_date minus carrier_handoff_date. |
| Late-delivery rate | late delivered orders divided by delivered orders in the segment. |

## **C Project artefacts** 

**Interactive executive dashboard:** https://dvd-project-fawn.vercel.app 

The dashboard is the interactive companion artefact for the fulfilment and customer-satisfaction analysis presented in this report. 

## **D Tools and project artefact management** 

| **Tool or platform** | **Use in the project** | **Submission role** |
|-----------|-----------|-----------|
| Python scripts | Repeatable extraction, cleaning, aggregation, feature engineering, checks and chart-ready datasets. | Provides reproducible pipeline code for evaluation. |
| Kaggle notebooks | Interactive exploratory data analysis, visual testing and documentation of findings. | Supports transparent EDA and shareable analysis runs. |
| LaTeX and Overleaf | Final typesetting, structured citations, equations and submission-ready report compilation. | Provides an evaluator-ready PDF workflow and a controlled report source. |
| Microsoft Word | Collaborative drafting, review, editing and stakeholder-facing documentation. | Supports document development and formatting review before final submission. |
| GitHub | Version-controlled codebase, work logs, notebook history and dashboard source files. | Provides evaluator access to reproducible code and contribution history. |
| Google Drive | Shared source extracts, enriched dataset, figures and supporting project documents. | Provides controlled sharing of large data artefacts. |
| Browser-based dashboard (Vercel) | Interactive management dashboard with decision-oriented visuals, filters and chart interactions. | Provides a live companion artefact for evaluator review and stakeholder communication. |

---

**End of report**
