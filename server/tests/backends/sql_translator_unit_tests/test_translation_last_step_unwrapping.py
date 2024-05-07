# ruff: noqa: E501
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline.pipeline import Pipeline

_DOMAIN_STEP = {"name": "domain", "domain": "beers_tiny"}


def test_append_not_as_last_step(translator: SQLTranslator) -> None:
    """It should be a regular CTE"""
    pipeline = Pipeline(
        steps=[
            _DOMAIN_STEP,
            {"name": "append", "pipelines": [[_DOMAIN_STEP]]},
            {"name": "select", "columns": ["a", "b"]},
        ]
    )
    assert translator.get_query_str(steps=pipeline.steps) == (
        # Domain step
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,'
        # other pipeline domain step
        '__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,'
        ## Start of the append step
        # append step, selecting columns of the main pipeline
        '__step_1_dummy__ AS ((SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy__") UNION ALL '
        # append step, selecting columns of the other pipeline
        '(SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "__step_0_dummy1__") '
        # ordering ot the UNION ALL
        'ORDER BY "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name") '
        ## End of the append step
        # select step
        'SELECT "a","b" FROM "__step_1_dummy__"'
    )


def test_append_as_last_step(translator: SQLTranslator) -> None:
    """It should be a CTE, and an order-preserving SELECT statement should materialize it"""
    pipeline = Pipeline(
        steps=[
            _DOMAIN_STEP,
            {
                "name": "append",
                "pipelines": [
                    [
                        _DOMAIN_STEP,
                        {"name": "select", "columns": ["foo", "bar"]},
                    ]
                ],
            },
        ]
    )
    assert translator.get_query_str(steps=pipeline.steps) == (
        # Domain step
        'WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,'
        # Domain step of the other pipeline
        '__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,'
        # Select step of the other pipeline
        '__step_1_dummy1__ AS (SELECT "foo","bar" FROM "__step_0_dummy1__") ,'
        ## Start of the append step
        # Selecting everything from the main pipeline, with "foo" and "bar" as null columns
        '__step_1_dummy__ AS ((SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",NULL "foo",NULL "bar" FROM "__step_0_dummy__") UNION ALL '
        # Selecting everything from the other pipeline, with all columns from the first pipeline as NULL
        '(SELECT NULL "price_per_l",NULL "alcohol_degree",NULL "name",NULL "cost",NULL "beer_kind",NULL "volume_ml",NULL "brewing_date",NULL "nullable_name","foo","bar" FROM "__step_1_dummy1__") '
        # Ordering the union on all columns
        'ORDER BY "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name","foo","bar") '
        ## End of the append step
        # Materializing the union, all columns should be selected
        'SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name","foo","bar" FROM "__step_1_dummy__" '
        # Materialization step should have the same ordering as the UNION ALL
        'ORDER BY "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name","foo","bar"'
    )


def test_nested_combinations_append_at_root(translator: SQLTranslator) -> None:
    pipeline = Pipeline(
        steps=[
            _DOMAIN_STEP,
            {"name": "text", "text": "root", "new_column": "root"},
            {"name": "select", "columns": ["root"]},
            {
                "name": "append",
                "pipelines": [
                    [
                        _DOMAIN_STEP,
                        {"name": "text", "text": "pipe1", "new_column": "col1"},
                        {"name": "select", "columns": ["col1"]},
                    ],
                    [
                        _DOMAIN_STEP,
                        {"name": "text", "text": "pipe2", "new_column": "col2"},
                        {"name": "select", "columns": ["col2"]},
                        {
                            "name": "join",
                            "on": [("name", "name"), ("beer_kind", "beer_kind")],
                            "type": "left",
                            "right_pipeline": [
                                _DOMAIN_STEP,
                                {"name": "text", "text": "pipe3", "new_column": "col3"},
                                {"name": "select", "columns": ["col3"]},
                            ],
                        },
                    ],
                ],
            },
        ]
    )

    assert translator.get_query_str(steps=pipeline.steps) == (
        # Root domain step
        """WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # Root text step
        """__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('root' AS TEXT) "root" FROM "__step_0_dummy__") ,"""
        # Root pipeline select step
        """__step_2_dummy__ AS (SELECT "root" FROM "__step_1_dummy__") ,"""
        # First pipeline domain step
        """__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # First pipeline text step
        """__step_1_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe1' AS TEXT) "col1" FROM "__step_0_dummy1__") ,"""
        # First pipeline select step
        """__step_2_dummy1__ AS (SELECT "col1" FROM "__step_1_dummy1__") ,"""
        # Second pipeline domain step
        """__step_0_dummy2__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # Second pipeline text step
        """__step_1_dummy2__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe2' AS TEXT) "col2" FROM "__step_0_dummy2__") ,"""
        # Second pipeline select step
        """__step_2_dummy2__ AS (SELECT "col2" FROM "__step_1_dummy2__") ,"""
        # Third pipeline domain step
        """__step_0_dummy3__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # Third pipeline text step
        """__step_1_dummy3__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe3' AS TEXT) "col3" FROM "__step_0_dummy3__") ,"""
        # Third pipeline select step
        """__step_2_dummy3__ AS (SELECT "col3" FROM "__step_1_dummy3__") ,"""
        # Second pipeline join   step
        """__step_3_dummy2__ AS (SELECT "__step_2_dummy2__"."col2","__step_2_dummy3__"."col3" FROM "__step_2_dummy2__" LEFT JOIN "__step_2_dummy3__" ON "__step_2_dummy2__"."name"="__step_2_dummy3__"."name" AND "__step_2_dummy2__"."beer_kind"="__step_2_dummy3__"."beer_kind" ORDER BY "__step_2_dummy2__"."name","__step_2_dummy2__"."beer_kind") ,"""
        ## Start of append step
        # columns for the first pipeline
        '__step_3_dummy__ AS ((SELECT "root",NULL "col1",NULL "col2",NULL "col3" FROM "__step_2_dummy__") '
        # columns for the second pipeline
        'UNION ALL (SELECT NULL "root","col1",NULL "col2",NULL "col3" FROM "__step_2_dummy1__") '
        # columns for the third pipeline
        'UNION ALL (SELECT NULL "root",NULL "col1","col2","col3" FROM "__step_3_dummy2__") '
        # UNION ALL ordering
        'ORDER BY "root","col1","col2","col3") '
        # append step materialization
        'SELECT "root","col1","col2","col3" FROM "__step_3_dummy__" ORDER BY "root","col1","col2","col3"'
    )


def test_nested_combinations_join_at_root(translator: SQLTranslator) -> None:
    pipeline = Pipeline(
        steps=[
            _DOMAIN_STEP,
            {"name": "text", "text": "root", "new_column": "root"},
            {"name": "select", "columns": ["root"]},
            {
                "name": "join",
                "on": [("name", "name"), ("beer_kind", "beer_kind")],
                "type": "left",
                "right_pipeline": [
                    _DOMAIN_STEP,
                    {"name": "text", "text": "pipe1", "new_column": "col1"},
                    {"name": "select", "columns": ["col1"]},
                    {
                        "name": "append",
                        "pipelines": [
                            [
                                _DOMAIN_STEP,
                                {"name": "text", "text": "pipe2", "new_column": "col2"},
                                {"name": "select", "columns": ["col2"]},
                            ],
                            [
                                _DOMAIN_STEP,
                                {"name": "text", "text": "pipe3", "new_column": "col3"},
                                {"name": "select", "columns": ["col3"]},
                            ],
                        ],
                    },
                ],
            },
        ]
    )
    assert translator.get_query_str(steps=pipeline.steps) == (
        # Root domain step
        """WITH __step_0_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # Root text step
        """__step_1_dummy__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('root' AS TEXT) "root" FROM "__step_0_dummy__") ,"""
        # Root select step
        """__step_2_dummy__ AS (SELECT "root" FROM "__step_1_dummy__") ,"""
        # Join step pipeline domain step
        """__step_0_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        # Join step pipeline text step
        """__step_1_dummy1__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe1' AS TEXT) "col1" FROM "__step_0_dummy1__") ,"""
        # Join step pipeline select step
        """__step_2_dummy1__ AS (SELECT "col1" FROM "__step_1_dummy1__") ,"""
        ## start of join step pipeline append step
        # first append pipeline
        """__step_0_dummy2__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        """__step_1_dummy2__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe2' AS TEXT) "col2" FROM "__step_0_dummy2__") ,"""
        """__step_2_dummy2__ AS (SELECT "col2" FROM "__step_1_dummy2__") ,"""
        # second append pipeline
        """__step_0_dummy3__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name" FROM "beers_tiny") ,"""
        """__step_1_dummy3__ AS (SELECT "price_per_l","alcohol_degree","name","cost","beer_kind","volume_ml","brewing_date","nullable_name",CAST('pipe3' AS TEXT) "col3" FROM "__step_0_dummy3__") ,"""
        """__step_2_dummy3__ AS (SELECT "col3" FROM "__step_1_dummy3__") ,"""
        # union all step
        """__step_3_dummy1__ AS ((SELECT "col1",NULL "col2",NULL "col3" FROM "__step_2_dummy1__") UNION ALL (SELECT NULL "col1","col2",NULL "col3" FROM "__step_2_dummy2__") UNION ALL (SELECT NULL "col1",NULL "col2","col3" FROM "__step_2_dummy3__") ORDER BY "col1","col2","col3") ,"""
        ## end of join step pipeline append step
        # Join step, should be in a CTE even if is the last step
        """__step_3_dummy__ AS (SELECT "__step_2_dummy__"."root","__step_3_dummy1__"."col1","__step_3_dummy1__"."col2","__step_3_dummy1__"."col3" FROM "__step_2_dummy__" LEFT JOIN "__step_3_dummy1__" ON "__step_2_dummy__"."name"="__step_3_dummy1__"."name" AND "__step_2_dummy__"."beer_kind"="__step_3_dummy1__"."beer_kind" ORDER BY "__step_2_dummy__"."name","__step_2_dummy__"."beer_kind") """
        'SELECT "root","col1","col2","col3" FROM "__step_3_dummy__" ORDER BY "root","col1","col2","col3"'
    )
