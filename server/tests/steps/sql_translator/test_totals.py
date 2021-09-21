from weaverbird.backends.sql_translator.steps.totals import translate_totals
from weaverbird.pipeline.steps import TotalsStep


def test_totals(query):
    step = TotalsStep(
        **{
            'name': 'totals',
            'totalDimensions': [
                {'totalColumn': 'COUNTRY', 'totalRowsLabel': 'All countries'},
                {'totalColumn': 'PRODUCT', 'totalRowsLabel': 'All products'},
            ],
            'aggregations': [
                {
                    'columns': ['VALUE_1', 'VALUE_2'],
                    'aggfunction': 'sum',
                    'newcolumns': ['VALUE_1-SUM', 'VALUE_2-SUM'],
                },
                {
                    'columns': ['VALUE_1'],
                    'aggfunction': 'avg',
                    'newcolumns': ['VALUE_1-AVG'],
                },
            ],
            'groups': ['YEAR'],
        }
    )
    new_query = translate_totals(
        step,
        query,
        index=1,
    )
    expected_query = (
        query.transformed_query + ', TOTALS_STEP_1 AS('
        """SELECT
CASE WHEN GROUPING(COUNTRY) = 0 THEN COUNTRY ELSE 'All countries' END,
CASE WHEN GROUPING(PRODUCT) = 0 THEN PRODUCT ELSE 'All products' END,
SUM(VALUE_1) AS VALUE_1-SUM, SUM(VALUE_2) AS VALUE_2-SUM, AVG(VALUE_1) AS VALUE_1-AVG, YEAR
FROM SELECT_STEP_0
GROUP BY
YEAR,
GROUPING SETS((COUNTRY), (PRODUCT), (COUNTRY,PRODUCT), ());""".replace(
            '\n', ' '
        )
        + ')'
    )

    assert new_query.transformed_query == expected_query
