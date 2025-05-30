# ruff:noqa: E501
import pytest

from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline import steps
from weaverbird.pipeline.pipeline import Pipeline, PipelineStep

_CASES: list[tuple[list[dict | PipelineStep], str]] = [
    (
        [steps.CustomSqlStep(query="SELECT * FROM beers_tiny")],
        'WITH __step_0_dummy__ AS (SELECT * FROM beers_tiny\n) SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__"',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[{"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]}],
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "beer_kind",COUNT("name") "beer_count" FROM "__step_0_dummy__" GROUP BY "beer_kind" ORDER BY "beer_kind" ASC NULLS LAST',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[{"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]}],
                count_nulls=True,
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "beer_kind",COUNT(*) "beer_count" FROM "__step_0_dummy__" GROUP BY "beer_kind" ORDER BY "beer_kind" ASC NULLS LAST',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[{"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]}],
                keep_original_granularity=True,
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "__step_0_dummy__"."price_per_l","__step_0_dummy__"."alcohol_degree","__step_0_dummy__"."name","__step_0_dummy__"."cost","__step_0_dummy__"."beer_kind","__step_0_dummy__"."volume_ml","__step_0_dummy__"."brewing_date","__step_0_dummy__"."nullable_name","sq0"."beer_count" FROM "__step_0_dummy__" LEFT JOIN (WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "beer_kind",COUNT("name") "beer_count" FROM "__step_0_dummy__" GROUP BY "beer_kind") "sq0" ON "__step_0_dummy__"."beer_kind"="sq0"."beer_kind" ORDER BY "__step_0_dummy__"."beer_kind" ASC NULLS LAST',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[{"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]}],
                keep_original_granularity=True,
                count_nulls=True,
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "__step_0_dummy__"."price_per_l","__step_0_dummy__"."alcohol_degree","__step_0_dummy__"."name","__step_0_dummy__"."cost","__step_0_dummy__"."beer_kind","__step_0_dummy__"."volume_ml","__step_0_dummy__"."brewing_date","__step_0_dummy__"."nullable_name","sq0"."beer_count" FROM "__step_0_dummy__" LEFT JOIN (WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") SELECT "beer_kind",COUNT(*) "beer_count" FROM "__step_0_dummy__" GROUP BY "beer_kind") "sq0" ON "__step_0_dummy__"."beer_kind"="sq0"."beer_kind" ORDER BY "__step_0_dummy__"."beer_kind" ASC NULLS LAST',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[
                    {"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]},
                    {
                        "aggfunction": "avg",
                        "new_columns": ["avg_price_per_l"],
                        "columns": ["price_per_l"],
                    },
                ],
            ),
            steps.AbsoluteValueStep(column="avg_price_per_l", new_column="avg_price_per_l_abs"),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy__ AS (SELECT "beer_kind",COUNT("name") "beer_count",AVG("price_per_l") "avg_price_per_l" FROM "__step_0_dummy__" GROUP BY "beer_kind" ORDER BY "beer_kind" ASC NULLS LAST) SELECT "beer_kind","beer_count","avg_price_per_l",ABS("avg_price_per_l") "avg_price_per_l_abs" FROM "__step_1_dummy__"',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.AggregateStep(
                on=["beer_kind"],
                aggregations=[
                    {"aggfunction": "count", "new_columns": ["beer_count"], "columns": ["name"]},
                    {
                        "aggfunction": "avg",
                        "new_columns": ["avg_price_per_l"],
                        "columns": ["price_per_l"],
                    },
                ],
                count_nulls=True,
            ),
            steps.AbsoluteValueStep(column="avg_price_per_l", new_column="avg_price_per_l_abs"),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy__ AS (SELECT "beer_kind",COUNT(*) "beer_count",AVG("price_per_l") "avg_price_per_l" FROM "__step_0_dummy__" GROUP BY "beer_kind" ORDER BY "beer_kind" ASC NULLS LAST) SELECT "beer_kind","beer_count","avg_price_per_l",ABS("avg_price_per_l") "avg_price_per_l_abs" FROM "__step_1_dummy__"',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.SelectStep(columns=["name", "beer_kind"]),
            steps.JoinStep(
                type="left",
                on=[("name", "name")],
                right_pipeline=[
                    steps.DomainStep(domain="beers_tiny"),
                    steps.SelectStep(columns=["name", "price_per_l"]),
                ],
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy__ AS (SELECT "name","beer_kind" FROM "__step_0_dummy__") ,__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy1__ AS (SELECT "name","price_per_l" FROM "__step_0_dummy1__") ,__step_2_dummy__ AS (SELECT "__step_1_dummy__"."name","__step_1_dummy__"."beer_kind","__step_1_dummy1__"."name" "name_right","__step_1_dummy1__"."price_per_l" FROM "__step_1_dummy__" LEFT JOIN "__step_1_dummy1__" ON "__step_1_dummy__"."name"="__step_1_dummy1__"."name" ORDER BY "__step_1_dummy__"."name") SELECT "name","beer_kind","name_right","price_per_l" FROM "__step_2_dummy__" ORDER BY "name","beer_kind","name_right","price_per_l"',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.SelectStep(columns=["name", "beer_kind"]),
            steps.JoinStep(
                type="left",
                on=[("name", "renamed")],
                right_pipeline=[
                    steps.DomainStep(domain="beers_tiny"),
                    steps.SelectStep(columns=["name", "price_per_l"]),
                    steps.RenameStep(to_rename=[("name", "renamed")]),
                ],
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy__ AS (SELECT "name","beer_kind" FROM "__step_0_dummy__") ,__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy1__ AS (SELECT "name","price_per_l" FROM "__step_0_dummy1__") ,__step_2_dummy1__ AS (SELECT "name" "renamed","price_per_l" FROM "__step_1_dummy1__") ,__step_2_dummy__ AS (SELECT "__step_1_dummy__"."name","__step_1_dummy__"."beer_kind","__step_2_dummy1__"."renamed","__step_2_dummy1__"."price_per_l" FROM "__step_1_dummy__" LEFT JOIN "__step_2_dummy1__" ON "__step_1_dummy__"."name"="__step_2_dummy1__"."renamed" ORDER BY "__step_1_dummy__"."name") SELECT "name","beer_kind","renamed","price_per_l" FROM "__step_2_dummy__" ORDER BY "name","beer_kind","renamed","price_per_l"',
    ),
    (
        [
            steps.DomainStep(domain="beers_tiny"),
            steps.SelectStep(columns=["name", "beer_kind"]),
            steps.JoinStep(
                type="left",
                on=[("name", "name")],
                right_pipeline=[
                    steps.DomainStep(domain="beers_tiny"),
                    steps.SelectStep(columns=["name", "price_per_l"]),
                    steps.JoinStep(
                        type="left",
                        on=[("name", "name")],
                        right_pipeline=[
                            steps.DomainStep(domain="beers_tiny"),
                            steps.SelectStep(columns=["name", "cost"]),
                        ],
                    ),
                    steps.SelectStep(columns=["name", "cost", "price_per_l"]),
                ],
            ),
        ],
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy__ AS (SELECT "name","beer_kind" FROM "__step_0_dummy__") ,__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy1__ AS (SELECT "name","price_per_l" FROM "__step_0_dummy1__") ,__step_0_dummy2__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,__step_1_dummy2__ AS (SELECT "name","cost" FROM "__step_0_dummy2__") ,__step_2_dummy1__ AS (SELECT "__step_1_dummy1__"."name","__step_1_dummy1__"."price_per_l","__step_1_dummy2__"."name" "name_right","__step_1_dummy2__"."cost" FROM "__step_1_dummy1__" LEFT JOIN "__step_1_dummy2__" ON "__step_1_dummy1__"."name"="__step_1_dummy2__"."name" ORDER BY "__step_1_dummy1__"."name") ,__step_3_dummy1__ AS (SELECT "name","cost","price_per_l" FROM "__step_2_dummy1__") ,__step_2_dummy__ AS (SELECT "__step_1_dummy__"."name","__step_1_dummy__"."beer_kind","__step_3_dummy1__"."name" "name_right","__step_3_dummy1__"."cost","__step_3_dummy1__"."price_per_l" FROM "__step_1_dummy__" LEFT JOIN "__step_3_dummy1__" ON "__step_1_dummy__"."name"="__step_3_dummy1__"."name" ORDER BY "__step_1_dummy__"."name") SELECT "name","beer_kind","name_right","cost","price_per_l" FROM "__step_2_dummy__" ORDER BY "name","beer_kind","name_right","cost","price_per_l"',
    ),
]


@pytest.mark.parametrize("steps, expected", _CASES)
def test_base_translator(translator: SQLTranslator, steps: list[str | PipelineStep], expected: str):
    pipeline = Pipeline(steps=steps)
    assert translator.get_query_str(steps=pipeline.steps) == expected
