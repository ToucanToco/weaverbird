import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps import translate_evolution
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.steps import EvolutionStep


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT TOTO, RAICHU, FLORIZARRE FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'TABLE1': {
                    'TOTO': 'text',
                    'RAICHU': 'int',
                    'FLORIZARRE': 'text',
                    'DATE': 'TIMESTAMP',
                }
            },
        ),
    )


def test_translate_evolution(mocker, query):
    step = EvolutionStep(
        name='evolution',
        dateCol='DATE',
        valueCol='RAICHU',
        evolutionType='vsLastMonth',
        evolutionFormat='abs',
    )
    query = translate_evolution(
        step,
        query,
        index=1,
    )

    expected_transformed_query = (
        "WITH SELECT_STEP_0 AS (SELECT * FROM products), EVOLUTION_STEP_1 AS "
        "(SELECT A.TOTO AS TOTO, A.RAICHU AS RAICHU, A.FLORIZARRE AS FLORIZARRE, A.DATE AS DATE, "
        "(A.RAICHU - B.RAICHU) AS RAICHU_EVOL_ABS FROM SELECT_STEP_0 A LEFT JOIN SELECT_STEP_0 B "
        "ON A.DATE = DATEADD('month', 1, B.DATE) ORDER BY A.DATE)"
    )
    assert query.transformed_query == expected_transformed_query
    assert (
        query.selection_query
        == 'SELECT TOTO, RAICHU, FLORIZARRE, DATE, RAICHU_EVOL_ABS FROM EVOLUTION_STEP_1'
    )
    assert query.query_name == 'EVOLUTION_STEP_1'
    assert query.metadata_manager.retrieve_query_metadata_columns() == {
        'DATE': ColumnMetadata(
            name='DATE',
            original_name='DATE',
            type='TIMESTAMP',
            original_type='TIMESTAMP',
            alias=None,
            delete=False,
        ),
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU_EVOL_ABS': ColumnMetadata(
            name='RAICHU_EVOL_ABS',
            original_name='RAICHU_EVOL_ABS',
            type='FLOAT',
            original_type='float',
            alias=None,
            delete=False,
        ),
    }


def test_translate_evolution_error(mocker, query):
    step = EvolutionStep(
        name='evolution',
        dateCol='DATE',
        valueCol='VALUE',
        evolutionType='vsLastMonth',
        evolutionFormat='abs',
    )
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.evolution.build_selection_query',
        side_effect=Exception,
    )
    with pytest.raises(Exception):
        translate_evolution(
            step,
            query,
            index=1,
        )
