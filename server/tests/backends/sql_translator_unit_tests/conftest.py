from typing import Any

import pytest
from pypika import Query
from pypika.queries import QueryBuilder

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, FromTable, SQLTranslator


@pytest.fixture
def default_step_kwargs() -> dict[str, Any]:
    return {
        "builder": QueryBuilder(),
        "prev_step_table": FromTable(table_name="previous_with", builder=None, query_class=Query),
    }


class Dummy(SQLTranslator):
    QUERY_CLS = Query
    DIALECT = SQLDialect.MYSQL
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="FLOAT",
        integer="INTEGER",
        text="TEXT",
        datetime="DATETIME",
        timestamp="TIMESTAMP",
    )

    @classmethod
    def _interval_to_seconds(cls, value):
        """Converts an INTERVAL SQL type to a duration in seconds"""


@pytest.fixture
def translator() -> SQLTranslator:
    return Dummy(
        tables_columns={
            "beers_tiny": [
                "price_per_l",
                "alcohol_degree",
                "name",
                "cost",
                "beer_kind",
                "volume_ml",
                "brewing_date",
                "nullable_name",
            ]
        }
    )
