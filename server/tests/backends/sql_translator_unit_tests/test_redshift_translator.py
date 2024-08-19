import pytest
from pypika.queries import Table

from weaverbird.backends.pypika_translator.translators.redshift import RedshiftTranslator


@pytest.fixture
def redshift_translator() -> RedshiftTranslator:
    return RedshiftTranslator(tables_columns={})


def test_recursive_concat(redshift_translator: RedshiftTranslator) -> None:
    the_table = Table("table")
    concat = redshift_translator._recursive_concat(
        None, [the_table["col1"], " - ", the_table["col2"], " - ", the_table["col3"]]
    )
    assert str(concat) == """CONCAT(CONCAT(CONCAT(CONCAT("col1",' - '),"col2"),' - '),"col3")"""
