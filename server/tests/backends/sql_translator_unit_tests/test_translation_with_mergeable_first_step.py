# ruff:noqa: E501
import pytest
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline.pipeline import Pipeline, PipelineStep

_CASES = [
    # Just a domain, should behave as usual
    [{"name": "domain", "domain": "beers_tiny"}],
    # These should get merged into a single step
    [
        {"name": "domain", "domain": "beers_tiny"},
        {
            "name": "filter",
            "condition": {"column": "volume_ml", "operator": "le", "value": 10},
        },
    ],
    # These too
    [
        {"name": "domain", "domain": "beers_tiny"},
        {"name": "top", "limit": 50, "rank_on": "alcohol_degree", "sort": "desc"},
    ],
    # However, nothing should be merged when the pipelines starts with a CustomSQL step
    [
        {"name": "customsql", "query": 'SELECT "foo" FROM "bar"."baz"'},
        {"name": "top", "limit": 50, "rank_on": "alcohol_degree", "sort": "desc"},
    ],
    # Here, only the first two steps should be merged
    [
        {"name": "domain", "domain": "beers_tiny"},
        {
            "name": "filter",
            "condition": {"column": "volume_ml", "operator": "le", "value": 10},
        },
        {"name": "filter", "condition": {"column": "nullable_name", "operator": "notnull"}},
    ],
    # Same here: only the first two steps should be merged
    [
        {"name": "domain", "domain": "beers_tiny"},
        {"name": "top", "limit": 50, "rank_on": "alcohol_degree", "sort": "asc"},
        {"name": "filter", "condition": {"column": "nullable_name", "operator": "notnull"}},
    ],
    # On the following one, the limit is smaller than source_rows_subset, so it should not be overriden
    [
        {"name": "domain", "domain": "beers_tiny"},
        {"name": "top", "limit": 5, "rank_on": "alcohol_degree", "sort": "desc"},
    ],
]

_EXPECTED_NO_SOURCE_ROW_SUBSET = [
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" WHERE "volume_ml"<=10) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" DESC LIMIT 50) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "foo" FROM "bar"."baz") ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" ORDER BY "alcohol_degree" DESC LIMIT 50) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" WHERE "volume_ml"<=10) ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" WHERE "nullable_name" IS NOT NULL) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" ASC LIMIT 50) ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" WHERE "nullable_name" IS NOT NULL) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" DESC LIMIT 5) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
]


@pytest.mark.parametrize(
    "steps, expected", zip(_CASES, _EXPECTED_NO_SOURCE_ROW_SUBSET, strict=True)
)
def test_base_translator_merge_first_steps(
    translator: SQLTranslator, steps: list[PipelineStep], expected: str
):
    pipeline = Pipeline(steps=steps)
    assert translator.get_query_str(steps=pipeline.steps) == expected


_EXPECTED_WITH_SOURCE_ROW_SUBSET = [
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" LIMIT 42) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" WHERE "volume_ml"<=10 LIMIT 42) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" DESC LIMIT 42) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    # First step is CustomSQL, source_rows_subset should have no impact
    'WITH __step_0_dummy__ AS (SELECT "foo" FROM "bar"."baz") ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" ORDER BY "alcohol_degree" DESC LIMIT 50) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" WHERE "volume_ml"<=10 LIMIT 42) ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" WHERE "nullable_name" IS NOT NULL) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" ASC LIMIT 42) ,__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__" WHERE "nullable_name" IS NOT NULL) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_1_dummy__"',
    'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny" ORDER BY "alcohol_degree" DESC LIMIT 5) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
]


@pytest.mark.parametrize(
    "steps, expected", zip(_CASES, _EXPECTED_WITH_SOURCE_ROW_SUBSET, strict=True)
)
def test_base_translator_merge_first_steps_with_subset(
    translator: SQLTranslator, steps: list[PipelineStep], expected: str
):
    translator._source_rows_subset = 42
    pipeline = Pipeline(steps=steps)
    assert translator.get_query_str(steps=pipeline.steps) == expected
