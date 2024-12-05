import pytest

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline.pipeline import Pipeline
from weaverbird.pipeline.steps.domain import DomainStep

_TABLES_COLUMNS = {"my_table": ["a", "b", "c"]}


@pytest.mark.parametrize(
    "offset,limit,source_rows_subset,expected",
    [
        pytest.param(0, None, None, 'SELECT "a","b","c" FROM "my_table"', id="defaults"),
        pytest.param(0, 50, None, 'SELECT "a","b","c" FROM "my_table" LIMIT 50', id="limit_only"),
        pytest.param(50, 50, None, 'SELECT "a","b","c" FROM "my_table" LIMIT 50 OFFSET 50', id="offset_and_limit"),
        pytest.param(
            50,
            50,
            10,
            'SELECT "a","b","c" FROM "my_table" LIMIT 10 OFFSET 50',
            id="offset_and_limit_and_source_rows_subset_smaller_than_limit",
        ),
    ],
)
def test_offset_limit_with_source_rows_subset_single_domain_step_postgres(
    offset: int, limit: int | None, source_rows_subset: int | None, expected: str
) -> None:
    pipe = Pipeline(steps=[DomainStep(domain="my_table")])
    translated = translate_pipeline(
        sql_dialect=SQLDialect.POSTGRES,
        pipeline=pipe,
        tables_columns=_TABLES_COLUMNS,
        offset=offset,
        limit=limit,
        source_rows_subset=source_rows_subset,
    )
    assert translated == expected


@pytest.mark.parametrize(
    "offset,limit,source_rows_subset,expected",
    [
        pytest.param(0, None, None, 'SELECT "a","b","c" FROM "my_table"', id="defaults"),
        pytest.param(0, 50, None, 'SELECT "a","b","c" FROM "my_table" LIMIT 50', id="limit_only"),
        pytest.param(50, 50, None, 'SELECT "a","b","c" FROM "my_table" OFFSET 50 LIMIT 50', id="offset_and_limit"),
        pytest.param(
            50,
            50,
            10,
            'SELECT "a","b","c" FROM "my_table" OFFSET 50 LIMIT 10',
            id="offset_and_limit_and_source_rows_subset_smaller_than_limit",
        ),
    ],
)
def test_offset_limit_with_source_rows_subset_single_domain_step_athena(
    offset: int, limit: int | None, source_rows_subset: int | None, expected: str
) -> None:
    pipe = Pipeline(steps=[DomainStep(domain="my_table")])
    translated = translate_pipeline(
        sql_dialect=SQLDialect.ATHENA,
        pipeline=pipe,
        tables_columns=_TABLES_COLUMNS,
        offset=offset,
        limit=limit,
        source_rows_subset=source_rows_subset,
    )
    assert translated == expected
