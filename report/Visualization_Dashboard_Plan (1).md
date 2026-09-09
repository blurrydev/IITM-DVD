**Visualization & Dashboard Plan** Extending the EDA Findings Toward the Interactive Dashboard Deliverable 

_Data Visualization Design Project — May 2026_ 

# 1. Purpose of This Document 

The team report (Team_Report_EDA_Findings.docx) established WHAT drives customer satisfaction. This document answers a different question: what should the Interactive Dashboard deliverable actually show, and why — so the team can build it directly from a shared plan instead of everyone guessing at chart choices independently. 

**The visualization problem we're solving: leadership needs to look at any segment of the business — a region, category, seller, or time period — and immediately see whether it's at risk, and why. The dashboard's job is not to repeat the report; it's to let someone explore a segment they haven't asked about yet.** 

# 2. Cross-Validation With Independent Team Analysis 

A teammate independently built their own data cleaning and EDA scripts (01_data_cleaning.py, 02_exploratory_analysis.py, insights_summary.md) without reference to our master_orders_enriched.csv pipeline. This is a valuable check — two independent approaches reached the same core conclusions: 

- Late delivery is the strongest driver of dissatisfaction 

- Deliveries past ~25 days show a sharp jump in 1-star reviews 

- Multi-seller orders score significantly worse 

- Same-state seller/customer pairs perform better 

- Category matters less than logistics factors 

### **This independent replication is good evidence our headline findings are robust, not an artifact of one team member's specific cleaning choices.** 

That said, there are methodology differences worth resolving before the whole team builds on one dataset: 

|**Gap inthe independent version**|**Why it matters**|
|---|---|
|No dedup of order_reviews (551 orders have duplicate review<br>rows)|Can silently inflate order counts if merged directly instead of<br>aggregated|
|No aggregation of order_payments (some orders have multiple<br>paymentrows)|Same risk of duplicate/inflated rows on merge|
|product_category_name not translated to English|Category charts will show Portuguese names — fine internally,<br>butnot presentation-ready|
|No documented missing-value or outlier check|Can't confirm delivery-time outliers were verified as real vs. data<br>errors|



### **Recommendation: standardize on ONE canonical dataset for the dashboard —** 

**master_orders_enriched.csv (98,666 rows x 40 columns) — so every chart in the dashboard uses consistent, documented cleaning logic. This avoids the team presenting slightly different numbers for the same metric.** 

# 3. Recommended Dashboard Structure 

Global filters (apply across every page/chart, this is what makes it 'interactive' per the brief rather than a set of static charts): 

- Date range (order purchase date) 

- Customer state 

- Product category 

- Delivery outcome (on-time / late) 

Suggested page/tab structure — four focused views rather than one crowded page: 

|**Page**|**Answers**|
|---|---|
|1. Overview|Is the business healthy right now, and is it trending better or worse?|
|2.Delivery &Logistics|Where and why are deliveriesfailing?|
|3. Seller Risk|Which sellers are the actual problem, and why (speed vs. quality)?|
|4. Category & Geography|Whichcategories/regionsneed attention?|



# 4. Chart-by-Chart Specification 

Each chart below lists: type, what it's built from, what question it answers, and priority. Must-have charts directly support the report's core claims; Stretch charts are valuable additions if time allows. 

Page 1 — Overview 

|**Chart**|**Type**|**Data / fields**|**Question answered**|**Priority**|
|---|---|---|---|---|
|KPI cards|4 number cards|n_orders, avg review_score, %<br>is_late, avg delivery_days|Is the business healthy right<br>now?|Must-have|
|Ordervolume trend|Line chart|purchase_month, count oforders|Is the business growing?|Must-have|
|Late-rate trend|Line chart (overlaid<br>orbelow volume)|purchase_month, is_late rate|Is service quality trending up or<br>downas we grow?|Must-have|



## Page 2 — Delivery & Logistics 

|**Chart**|**Type**|**Data / fields**|**Question answered**|**Priority**|
|---|---|---|---|---|
|Delivery-time cliff|Bar chart|delivery_days bucketed (0-5,6-<br>10,11-15,16-25,25+) vs avg<br>review_score|Where does satisfaction<br>collapse?|Must-have|
|Delivery stage<br>breakdown|Grouped/stacked bar|approval_lag_hours,<br>seller_handling_days,<br>carrier_transit_days vs<br>review_score|Which stage of fulfillment to<br>fix?|Must-have|
|Distance vs delivery<br>time & score|Dual-axis bar+line|distance_km bucketed vs avg<br>delivery_days (bars) and avg<br>review_score (line)|Does distance matter directly, or<br>only through delay?|Stretch|
|Multi-seller impact|Bar chart|n_sellers vs avg review_score|Does order fragmentation hurt<br>satisfaction?|Must-have|



## Page 3 — Seller Risk 

|**Chart**|**Type**|**Data / fields**|**Question answered**|**Priority**|
|---|---|---|---|---|
|Seller scorecard table|Sortable/filterable<br>data table|seller_id, seller_n_orders,<br>seller_revenue,<br>seller_avg_score,<br>seller_late_rate|Which specific sellers need<br>intervention?|Must-have|
|Revenue concentration|Pareto / cumulative<br>line chart|sellers ranked by revenue,<br>cumulative % oftotal|How much does the business<br>depend onafew sellers?|Must-have|
|Speed vs quality<br>quadrant|Scatter plot|x = seller_late_rate, y =<br>seller_avg_score, size =<br>seller_n_orders|Is a seller's problem shipping<br>speed or product quality?|Stretch —<br>directly<br>operationa<br>lizes the<br>'$188K/3.<br>34-star'<br>finding|



## Page 4 — Category & Geography 

|**Chart**|**Type**|**Data / fields**|**Question answered**|**Priority**|
|---|---|---|---|---|
|State map|Choropleth map|customer_state, avg<br>review_score or late_rate<br>(toggle)|Which regions need logistics<br>investment?|Must-have|
|Category comparison|Horizontal bar, sorted|main_category vs avg<br>review_score (min. 200 orders)|Which product categories<br>underperform?|Must-have|
|Comment behavior|Bar chart|review_score vs % of reviews<br>with a written comment|Where is qualitative complaint<br>data concentrated?|Stretch|



# 5. Priority Ranking: Must-Use vs. Should-Use Charts 

Section 4 lists every candidate chart per dashboard page. This section ranks them across the whole dashboard, with the specific evidence that justifies each ranking — so the team can build in the right order if time runs short. 

## 5.1 Must-use — these directly carry the core findings 

|**#**|**Chart**|**Type**|**Why it's non-negotiable**|
|---|---|---|---|
|1|Delivery-time cliff|Bar: delivery bucket vs avg<br>review_score|Single strongest finding (r = -0.30, 43.6% one-star past 25<br>days). If the dashboard had only one chart, it would be this<br>one — it directly proves the headline claim of the whole<br>project.|
|2|Multi-seller impact|Bar: n_sellers vs avg<br>review_score|Most surprising, non-obvious finding (4.12 -> 2.88 -> 2.35).<br>Non-obvious findings are what make a project memorable to<br>leadership — 'late = bad' doesn't need a dashboard to explain<br>it, but this one does.|
|3|Seller scorecard table|Sortable/filterable data table|The only chart that lets leadership actually ACT — drill into a<br>specific seller_id and decide to intervene. Every other chart<br>informs; this one enables a decision, which is literally what an<br>interactive dashboard is for.|
|4|State map|Choropleth: avg score or<br>late_rate by state|The brief explicitly asks 'which regions' — a table of state<br>names doesn't answer that as fast as a map. Nothing conveys<br>geographic concentrationof riskasinstantly.|
|5|Delivery stage breakdown|Grouped bar: approval lag /<br>seller handling / carrier transit vs<br>score|Without this, 'fix delivery' is vague advice. With it, we can<br>say precisely WHICH stage to fix (carrier transit, r = -0.30, vs<br>seller handling, r = -0.16) — turns a diagnosis into an<br>actionablerecommendation.|



## 5.2 Should-use — strong value-add, not load-bearing 

|**#**|**Chart**|**Type**|**Reason**|
|---|---|---|---|
|6|Revenue concentration<br>(Pareto)|Cumulative % line|Justifies WHY seller-level risk matters at all — top 1% of<br>sellers generate 25.7% of revenue. Without this, 'watch your<br>sellers'sounds generic; with it,it's clearlyhigh-stakes.|
|7|Category comparison|Sorted horizontal bar|The brief explicitly asks 'which categories' — cheap to build,<br>directly answers a named question in the problem statement,<br>even though the effect size is smaller than logistics factors.|
|8|Order volume + late-rate<br>trend|Dual-line chart over time|<br>Gives forward-looking context nothing else provides — is the<br>business improving or getting worse as it scales?|
|9|Speed vs. quality quadrant|Scatter: late_rate (x) vs<br>avg_score (y), sized by order<br>volume|<br>Visually proves the sharpest single insight — the $188K<br>seller with a LOW late rate but a terrible score. A scatter<br>shows thisinstantly; a tablerow would buryit.|



## 5.3 Deliberately excluded — and why 

- Freight / payment-type charts — already validated as near-zero effect (r = -0.09, flat across payment types). Charting a null result wastes dashboard space and viewer attention on the weakest evidence. 

- Comment-length / comment-rate chart — interesting, but about FUTURE work (text mining), not a current risk signal leadership can act on today. Fine as a report footnote, not dashboard real estate. 

**Rule of thumb for defending this list if challenged: every must-use chart maps to a correlation or effect size already validated at r >= 0.15, or a >1-star average score gap. The should-use charts answer questions the brief asks explicitly, even where the effect is smaller.** 

# 6. Tooling Options 

|**Tool**|**Good fit if...**|**Tradeoff**|
|---|---|---|
|Streamlit (Python)|Team is comfortable in Python, wants fast build,<br>needs filters+tables+charts|Less polished default styling than BI tools|
|Plotly Dash (Python)|Team wants more custom interactivity (e.g. the<br>quadrant scatter, drill-down)|Steeper learning curve than Streamlit|
|Tableau / Power BI|<br>Team wants drag-and-drop, no-code, polished maps<br>out of the box|Less flexible for custom logic (e.g. the 3-stage<br>delivery decomposition)|



Given the team already has Python scripts (pandas-based cleaning/EDA), Streamlit is the lowest-friction choice — it can load master_orders_enriched.csv directly and most of these charts are a few lines each with plotly/matplotlib inside it. 

# 7. Next Steps 

- Agree as a team to standardize on master_orders_enriched.csv as the single source of truth (Section 2). 

- Assign each dashboard page (Section 3-4) to a team member. 

- Build Must-have charts first; treat Stretch charts as time allows. 

- Once built, sanity-check each chart's numbers against the figures already verified in Team_Report_EDA_Findings.docx — if they don't match, the dashboard has a bug, not a new finding. 

- Update individual contribution logs as each page is built. 

