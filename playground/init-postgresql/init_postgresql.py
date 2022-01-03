"""
Run this script against your PostgreSQL database to insert playground's tables
"""
from glob import glob
from os.path import splitext, basename
from typing import Dict

import pandas as pd
from sqlalchemy import create_engine

CONNECTION_STRING = 'postgresql://'  # Change me!

csv_files = glob('../datastore/*.csv')
json_files = glob('../datastore/*.json')

tables: Dict[str, pd.DataFrame] = {
    **{splitext(basename(csv_file))[0]: pd.read_csv(csv_file) for csv_file in csv_files},
    **{
        splitext(basename(json_file))[0]: pd.read_json(json_file, orient='table')
        for json_file in json_files
    },
}

conn = create_engine(CONNECTION_STRING)
for table_name, table_df in tables.items():
    table_df.to_sql(table_name, conn, if_exists='replace')
