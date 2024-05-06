from typing import Any

import pytest
from pypika import Query
from pypika.queries import QueryBuilder
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators.base import FromTable, SQLTranslator


@pytest.fixture
def default_step_kwargs() -> dict[str, Any]:
    return {
        "builder": QueryBuilder(),
        "prev_step_table": FromTable(table_name="previous_with", builder=None, query_class=Query),
    }


@pytest.fixture
def translator() -> SQLTranslator:
    class DummyTranslator(SQLTranslator):
        QUERY_CLS = Query
        DIALECT = SQLDialect.MYSQL
        known_instances = {}

        def _id(self) -> str:
            if id(self) in DummyTranslator.known_instances:
                return DummyTranslator.known_instances[id(self)]
            if len(DummyTranslator.known_instances.keys()) == 0:
                DummyTranslator.known_instances[id(self)] = "dummy"
                return "dummy"
            else:
                id_ = "dummy" + str(len(DummyTranslator.known_instances.keys()))
                DummyTranslator.known_instances[id(self)] = id_
                return id_

        @classmethod
        def _interval_to_seconds(cls, value):
            """Converts an INTERVAL SQL type to a duration in seconds"""

    return DummyTranslator(
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
