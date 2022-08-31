import pytest

from weaverbird.backends.sql_translator.metadata import SqlQueryMetadataManager
from weaverbird.backends.sql_translator.types import SQLQuery


@pytest.fixture
def query():
    return SQLQuery(
        query_name="SELECT_STEP_0",
        transformed_query="WITH SELECT_STEP_0 AS (SELECT * FROM products)",
        selection_query="SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0",
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={"TABLE1": {"TOTO": "text", "RAICHU": "int", "FLORIZARRE": "text"}},
        ),
    )
