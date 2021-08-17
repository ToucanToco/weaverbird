import pytest

from weaverbird.backends.sql_translator.steps import translate_convert
from weaverbird.backends.sql_translator.steps.uppercase import translate_uppercase
from weaverbird.backends.sql_translator.types import SQLQuery, SqlQueryMetadataManager
from weaverbird.pipeline.steps import ConvertStep, UppercaseStep


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={'table1': {'toto': 'str', 'raichu': 'int', 'florizarre': 'str'}}
        ),
    )


def test_translate_simple_uppercase(query):
    step = UppercaseStep(name='uppercase', column='raichu')

    query = translate_uppercase(
        step,
        query,
        index=1,
    )
    expected_transformed_query = (
        'WITH SELECT_STEP_0 AS (SELECT * FROM products), UPPERCASE_STEP_1 AS (SELECT toto, florizarre,  UPPER(raichu) '
        'AS raichu FROM SELECT_STEP_0) '
    )
    assert query.transformed_query == expected_transformed_query
    assert query.selection_query == 'SELECT toto, raichu, florizarre FROM UPPERCASE_STEP_1'
    assert query.query_name == 'UPPERCASE_STEP_1'


# def test_translate_cast_redondant_column_error(query):
#     step = ConvertStep(name='convert', columns=['raichu'], data_type='text')
#
#     mock_query = SQLQuery(
#         query_name='SELECT_STEP_0',
#         transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
#         selection_query='SELECT toto, raichu, florizarre FROM SELECT_STEP_0',
#         metadata_manager=SqlQueryMetadataManager(
#             tables_metadata={'table1': {'toto': 'str', 'RAICHU': 'int', 'florizarre': 'str'}}
#         ),
#     )
#
#     with pytest.raises(AssertionError):
#         assert translate_convert(step, query, index=1) == translate_convert(
#             step, mock_query, index=1
#         )
#
#
# def test_translate_cast_error(query):
#     step = ConvertStep(name='convert', columns=['raichu'], data_type='integer')
#     mock_step = ConvertStep(name='convert', columns=['raichu'], data_type='text')
#
#     with pytest.raises(AssertionError):
#         assert translate_convert(step, query, index=1) == translate_convert(
#             mock_step, query, index=1
#         )
#
#
# def test_simple_uppercase():
#     sample_df = pd.DataFrame({'values': ['foobar', 'flixbuz']})
#     step = UppercaseStep(name='uppercase', column='values')
#     result_df = execute_uppercase(step, sample_df)
#     expected_df = pd.DataFrame({'values': ['FOOBAR', 'FLIXBUZ']})
#
#     assert_dataframes_equals(result_df, expected_df)
#
#
# def test_utf8_uppercase():
#     sample_df = pd.DataFrame({'values': ['foobar', 'óó']})
#     step = UppercaseStep(name='uppercase', column='values')
#     result_df = execute_uppercase(step, sample_df)
#     expected_df = pd.DataFrame({'values': ['FOOBAR', 'ÓÓ']})
#
#     assert_dataframes_equals(result_df, expected_df)
#
#
# def test_benchmark_uppercase(benchmark):
#     groups = ['group_1', 'group_2']
#     df = pd.DataFrame(
#         {
#             'value': np.random.random(1000),
#             'id': list(range(1000)),
#             'group': [random.choice(groups) for _ in range(1000)],
#         }
#     )
#
#     step = UppercaseStep(name='uppercase', column='group')
#     benchmark(execute_uppercase, step, df)
