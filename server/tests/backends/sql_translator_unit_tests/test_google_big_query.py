import pytest
from weaverbird.backends.pypika_translator.translators.googlebigquery import (
    GoogleBigQueryTranslator,
)
from weaverbird.pipeline.steps import DomainStep, FilterStep


@pytest.fixture
def gbq_translator() -> GoogleBigQueryTranslator:
    return GoogleBigQueryTranslator(tables_columns={"table": ["col1", "col2", "col3"]})


def test_escape_names(gbq_translator: GoogleBigQueryTranslator) -> None:
    query = gbq_translator.get_query_str(
        steps=[
            DomainStep(domain="table"),
            FilterStep(condition={"column": "col1", "operator": "in", "value": ["pika", "l'alcool"]}),
        ]
    )
    assert query == (
        "WITH __step_0_googlebigquerytranslator__ AS ("
        r"SELECT `col1`,`col2`,`col3` FROM `table` WHERE `col1` IN ('pika','l\'alcool')) "
        "SELECT `col1`,`col2`,`col3` FROM `__step_0_googlebigquerytranslator__`"
    )
