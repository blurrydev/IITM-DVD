# Dataset download and setup

All raw and cleaned project datasets are available in the shared Google Drive folder:

https://drive.google.com/drive/folders/1CZemi5Ws71fA9cniJ_gN4Kcjk8fP45F_?usp=drive_link

## Download the source files

1. Open the Google Drive folder above.
2. Download the raw dataset files and extract them if they are stored in a ZIP archive.
3. Place every raw CSV file from the folder in `data/raw/` without renaming or modifying it.
4. Download the cleaned and enriched project datasets into `data/`.

```text
data/
├── raw/                         # Raw CSV files downloaded from the shared folder
├── master_orders.csv             # Cleaned, joined order-level dataset
└── master_orders_enriched.csv    # Feature-engineered final analysis dataset
```

## Generated project datasets

The raw source files are transformed in the following order:

```text
data/raw/                    Original source files
data/master_orders.csv       Cleaned, joined one-row-per-order dataset
data/master_orders_enriched.csv
                              Feature-engineered final analysis dataset
```

Run the project scripts in order to create the processed files:

```bash
python scripts/01_build_master_table.py
python scripts/02_exploratory_analysis.py
python scripts/03_feature_engineering.py
python scripts/04_advanced_analysis.py
```

`master_orders_enriched.csv` is the source of truth for the report metrics, charts, and dashboard.
