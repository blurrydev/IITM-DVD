# E Commerce Order Experience Analysis

An exploratory data analysis project on marketplace delivery reliability, order complexity, and customer satisfaction. The project uses the Olist e-commerce dataset to identify the operational factors associated with low customer review scores and translate them into management actions.

## Business objective

The marketplace wants to increase seller participation and order volume without reducing customer satisfaction. We investigate the post-purchase journey to determine which operational issues should be addressed first.

The analysis focuses on five decision questions:

1. How do delivery time and late delivery affect review scores?
2. Does satisfaction deteriorate more during seller handling or carrier transit?
3. Do orders fulfilled by multiple sellers create a separate customer-experience risk?
4. Which customer regions and sellers should receive priority intervention?
5. Do product, payment, price, freight, and geography materially change the fulfilment conclusion?

## Key findings

- On-time orders average **4.23 / 5**, compared with **2.27 / 5** for late orders.
- Orders delivered in **25 days or more** average **2.61 / 5**, and **43.6%** receive a one-star review.
- Carrier transit has a stronger negative relationship with satisfaction than seller handling or approval delay.
- One-seller orders average **4.12 / 5**; two-seller orders average **2.88 / 5**.
- The top 10% of sellers account for approximately **67.5%** of marketplace order value, so targeted support is preferable to blanket seller restrictions.

## Repository structure

```text
IITM-DVD/
|
|-- README.md
|
|-- backend/
|
|-- frontend/
|
|-- dashboard/
|
|-- data/
|   |-- raw/                         # Original 9 CSV files
|   |-- master_orders.csv            # Cleaned and joined order-level dataset
|   `-- master_orders_enriched.csv   # Feature-engineered analysis dataset
|
|-- scripts/
|   |-- 01_build_master_table.py
|   |-- 02_exploratory_analysis.py
|   |-- 03_feature_engineering.py
|   `-- 04_advanced_analysis.py
|
|-- report/
|   |-- DVD_ Team_001_Technical Report.docx
|   |-- DVD_ Team_001_Technical Report.md
|   |-- Team_Report_EDA_Findings.docx
|   |-- Team_Report_EDA_Findings.md
|   |-- Visualization_Dashboard_Plan .docx
|   `-- Visualization_Dashboard_Plan (1).md
|
|-- presentation/
|   |-- presentation_script.md
|   `-- final_slides.pptx
|
`-- work_logs/
    |-- work_log_name1.md
    |-- work_log_name2.md
    `-- one_log_per_teammate.md
```

## How to run the analysis

### 1. Prepare the environment

Use Python 3.10 or later. Create and activate a virtual environment, then install the packages used by the scripts.

```bash
python -m venv .venv
```

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

```bash
pip install pandas numpy matplotlib seaborn plotly jupyter
```

### 2. Add the source files

Place the original Olist CSV files in `data/raw/`. Do not commit large raw or enriched datasets to GitHub unless Git LFS is configured. Share these files through the team Google Drive folder and add the public evaluator link below.

### 3. Run the pipeline in order

```bash
python scripts/01_build_master_table.py
python scripts/02_exploratory_analysis.py
python scripts/03_feature_engineering.py
python scripts/04_advanced_analysis.py
```

The final source of truth for charts and dashboard metrics is `data/master_orders_enriched.csv`.

### 4. Access the interactive dashboard

The interactive management dashboard is hosted live on Vercel:

🔗 **[Marketplace Delivery and Satisfaction Intelligence](https://dvd-project-fawn.vercel.app)**

## Reproducibility and data preparation

The analysis uses **one row per order**. Item, payment, and review tables have one-to-many relationships with orders, so they are aggregated before joining. This prevents duplicate reviews and payments from giving any order disproportionate influence on the results.

Main derived measures:

- `delivery_time_days`: customer delivery date minus purchase timestamp
- `late_delivery`: actual delivery date later than estimated delivery date
- `seller_handling_days`: carrier handoff minus order approval
- `carrier_transit_days`: customer delivery minus carrier handoff
- `n_sellers`: number of distinct sellers in each order

The scripts also validate duplicate order IDs, missing timestamps, logically impossible intervals, and extreme delivery durations before reporting results.

## Project artefacts

Add public, evaluator-accessible links before submission and verify them in an incognito browser window.

| Artefact | Link |
|---|---|
| Live dashboard | [https://dvd-project-fawn.vercel.app](https://dvd-project-fawn.vercel.app) |
| GitHub repository | [https://github.com/blurrydev/IITM-DVD](https://github.com/blurrydev/IITM-DVD) |
| Google Drive dataset folder | [Google Drive Folder](https://drive.google.com/drive/folders/1CZemi5Ws71fA9cniJ_gN4Kcjk8fP45F_?usp=drive_link) |
| Final technical report | [report/DVD_ Team_001_Technical Report.md](report/DVD_%20Team_001_Technical%20Report.md) |
| Overleaf project or final PDF | `ADD_PUBLIC_OVERLEAF_OR_PDF_LINK` |
| Final presentation | https://drive.google.com/drive/folders/1TaFyAda0lBb3GN_nzA3eKT3QZiAgSCsO?usp=sharing |

## Tools used

- **Python scripts** for data cleaning, joins, feature engineering, validation, and reproducible analysis
- **Kaggle notebooks** for interactive EDA and visual exploration
- **LaTeX and Overleaf** for final technical-report typesetting and PDF production
- **Microsoft Word** for collaborative drafting and document review
- **GitHub** for version-controlled code, notebooks, and team work logs
- **Google Drive** for source datasets, enriched data, figures, and supporting documents
- **Vercel-hosted browser dashboard** for interactive management reporting

## Management recommendation

Prioritise carrier-transit exceptions before orders enter the 25+ day delivery band, use region-specific service promises, disclose split fulfilment at checkout, and support high-value sellers with elevated late rates. Track the 25+ day share, late-delivery rate, rating gap, multi-seller rating gap, seller growth, and order volume together.

