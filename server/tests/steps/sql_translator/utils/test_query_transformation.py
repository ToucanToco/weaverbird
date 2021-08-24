import pytest

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    apply_condition,
    build_join_query,
    build_selection_query,
    handle_zero_division,
    snowflake_date_format,
)
from weaverbird.pipeline.conditions import (
    BaseCondition,
    ComparisonCondition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)


def test_apply_condition_comparisons():
    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='eq', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount = 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ne', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount != 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='lt', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount < 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='le', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount <= 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='gt', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount > 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ge', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount >= 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ge', value='blabla'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount >= 'blabla'"
    )


def test_apply_condition_nullity():
    assert (
        apply_condition(
            NullCondition(column='origin', operator='isnull'),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE origin IS NULL'
    )
    assert (
        apply_condition(
            NullCondition(column='origin', operator='notnull'),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE origin IS NOT NULL'
    )


def test_apply_condition_match():
    assert (
        apply_condition(
            MatchCondition(column='origin', operator='matches', value='^f.*'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin RLIKE '^f.*'"
    )
    assert (
        apply_condition(
            MatchCondition(column='origin', operator='notmatches', value='^f.*'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin NOT RLIKE '^f.*'"
    )


def test_apply_condition_inclusion():
    assert (
        apply_condition(
            InclusionCondition(column='origin', operator='in', value=['france', 'spain', 'italy']),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin IN ('france', 'spain', 'italy')"
    )
    assert (
        apply_condition(
            InclusionCondition(column='origin', operator='nin', value=['france', 'spain', 'italy']),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin NOT IN ('france', 'spain', 'italy')"
    )


def test_apply_condition_conditioncomboand():
    assert (
        apply_condition(
            ConditionComboAnd(
                and_=[
                    ComparisonCondition(column='amount', operator='gt', value=10),
                    MatchCondition(column='origin', operator='matches', value='^france'),
                    InclusionCondition(
                        column='type', operator='nin', value=['meat', 'vegetables', 'corn']
                    ),
                ]
            ),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount > 10 AND origin RLIKE '^france' AND type NOT IN ('meat', "
        "'vegetables', 'corn')"
    )


def test_apply_condition_conditioncomboor():
    assert (
        apply_condition(
            ConditionComboOr(
                or_=[
                    ComparisonCondition(column='amount', operator='gt', value=10),
                    MatchCondition(column='origin', operator='matches', value='^fra.*'),
                    InclusionCondition(
                        column='type', operator='nin', value=['meat', 'vegetables', 'corn']
                    ),
                ]
            ),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount > 10 OR origin RLIKE '^fra.*' OR type NOT IN ('meat', "
        "'vegetables', 'corn')"
    )


def test_apply_not_implemented():
    class FakeCondition(BaseCondition):
        ...

    with pytest.raises(NotImplementedError):
        apply_condition(FakeCondition(), query='coucou')


def test_build_selection_query():
    assert (
        build_selection_query({'toto': 'tata'}, 'SELECT_STEP_0') == 'SELECT toto FROM SELECT_STEP_0'
    )


def test_build_selection_query_empty_cols():
    assert build_selection_query({}, 'SELECT_STEP_0') == 'SELECT  FROM SELECT_STEP_0'


def test_handle_zero_division_no_division():
    assert handle_zero_division('AGE - YEAR + 2000') == 'AGE - YEAR + 2000'


def test_handle_zero_division_only_div():
    assert (
        handle_zero_division('1 / PIPEAU / "BLA    BLA"')
        == '1 / NULLIF(PIPEAU, 0) / NULLIF("BLA    BLA", 0)'
    )


def test_handle_zero_division_only_modulo():
    assert (
        handle_zero_division('1 % PIPEAU % "BLA    BLA"')
        == '1 % NULLIF(PIPEAU, 0) % NULLIF("BLA    BLA", 0)'
    )


def test_handle_zero_division_modulo_and_div():
    assert (
        handle_zero_division('1 % PIPEAU / "BLA    BLA"')
        == '1 % NULLIF(PIPEAU, 0) / NULLIF("BLA    BLA", 0)'
    )


def test_simple_date_format():
    assert ", 'YYYY'" == snowflake_date_format('%Y')
    assert ", 'MON'" == snowflake_date_format('%b')
    assert ", 'MMMM'" == snowflake_date_format('%B')
    assert ", 'YYYY'" == snowflake_date_format('%y')
    assert ", 'MM'" == snowflake_date_format('%M')
    assert ", 'MM'" == snowflake_date_format('%m')
    assert ", 'DD'" == snowflake_date_format('%D')
    assert ", 'DD'" == snowflake_date_format('%d')


def test_complex_date_format():
    assert ", 'DD/MM/YYYY'" == snowflake_date_format('%d/%m/%y')
    assert ", 'YYYY-MM-DD'" == snowflake_date_format('%y-%m-%d')
    assert ", 'MM-YYYY, hh24:mi:ss'" == snowflake_date_format('%m-%y, hh24:mi:ss')


def test_empty_date_format():
    assert '' == snowflake_date_format('')


def test_ignore_none_date_format():
    assert ", 'badaboum'" == snowflake_date_format('badaboum')


def test_build_join_query():
    assert (
        build_join_query(
            query_metadata={'ID': 'int', 'NAME': 'str'},
            query_to_join_metadata={'CUSTOMER_ID': 'int', 'CUSTOMER_NAME': 'str'},
            left_query_name='SELECT_STEP_0',
            right_query_name='JOIN_STEP_1_RIGHT',
            right_query='SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS',
            step_index=1,
            left_on=['ID'],
            right_on=['CUSTOMER_ID'],
            how='INNER',
        )
        == 'JOIN_STEP_1_RIGHT AS (SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS), JOIN_STEP_1 AS (SELECT ID AS ID_LEFT, '
        'NAME AS NAME_LEFT, CUSTOMER_ID AS CUSTOMER_ID_RIGHT, CUSTOMER_NAME AS CUSTOMER_NAME_RIGHT FROM '
        'SELECT_STEP_0 INNER JOIN JOIN_STEP_1_RIGHT ON SELECT_STEP_0.ID = JOIN_STEP_1_RIGHT.CUSTOMER_ID)'
    )


def test_build_join_query_no_query_to_join_metadata():
    assert (
        build_join_query(
            query_metadata={'ID': 'int', 'NAME': 'str'},
            query_to_join_metadata={},
            left_query_name='SELECT_STEP_0',
            right_query_name='JOIN_STEP_1_RIGHT',
            right_query='SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS',
            step_index=1,
            left_on=['ID'],
            right_on=['CUSTOMER_ID'],
            how='INNER',
        )
        == 'JOIN_STEP_1_RIGHT AS (SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS), JOIN_STEP_1 AS (SELECT ID AS ID_LEFT, '
        'NAME AS NAME_LEFT,  FROM '
        'SELECT_STEP_0 INNER JOIN JOIN_STEP_1_RIGHT ON SELECT_STEP_0.ID = JOIN_STEP_1_RIGHT.CUSTOMER_ID)'
    )


def test_build_join_query_same_table():
    assert (
        build_join_query(
            query_metadata={'ID': 'int', 'NAME': 'str'},
            query_to_join_metadata={'ID': 'int', 'NAME': 'str'},
            left_query_name='SELECT_STEP_0',
            right_query_name='JOIN_STEP_1_RIGHT',
            right_query='SELECT ID, NAME FROM ORDERS',
            step_index=1,
            left_on=['ID'],
            right_on=['ID'],
            how='INNER',
        )
        == 'JOIN_STEP_1_RIGHT AS (SELECT ID, NAME FROM ORDERS), JOIN_STEP_1 AS (SELECT ID AS ID_LEFT, '
        'NAME AS NAME_LEFT, ID AS ID_RIGHT, NAME AS NAME_RIGHT FROM '
        'SELECT_STEP_0 INNER JOIN JOIN_STEP_1_RIGHT ON SELECT_STEP_0.ID = JOIN_STEP_1_RIGHT.ID)'
    )


def test_build_join_query_empty_right():
    assert (
        build_join_query(
            query_metadata={'ID': 'int', 'NAME': 'str'},
            query_to_join_metadata={},
            left_query_name='SELECT_STEP_0',
            right_query_name='JOIN_STEP_1_RIGHT',
            right_query='',
            step_index=1,
            left_on=['ID'],
            right_on=[],
            how='INNER',
        )
        == 'JOIN_STEP_1_RIGHT AS (), JOIN_STEP_1 AS (SELECT ID AS ID_LEFT, '
        'NAME AS NAME_LEFT,  FROM '
        'SELECT_STEP_0 INNER JOIN JOIN_STEP_1_RIGHT ON )'
    )


def test_build_left_outer_join_query():
    assert (
        build_join_query(
            query_metadata={'ID': 'int', 'NAME': 'str'},
            query_to_join_metadata={'CUSTOMER_ID': 'int', 'CUSTOMER_NAME': 'str'},
            left_query_name='SELECT_STEP_0',
            right_query_name='JOIN_STEP_1_RIGHT',
            right_query='SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS',
            step_index=1,
            left_on=['ID'],
            right_on=['CUSTOMER_ID'],
            how='LEFT OUTER',
        )
        == 'JOIN_STEP_1_RIGHT AS (SELECT CUSTOMER_ID, CUSTOMER_NAME FROM ORDERS), JOIN_STEP_1 AS (SELECT ID AS ID_LEFT, '
        'NAME AS NAME_LEFT, CUSTOMER_ID AS CUSTOMER_ID_RIGHT, CUSTOMER_NAME AS CUSTOMER_NAME_RIGHT FROM '
        'SELECT_STEP_0 LEFT OUTER JOIN JOIN_STEP_1_RIGHT ON SELECT_STEP_0.ID = JOIN_STEP_1_RIGHT.CUSTOMER_ID)'
    )
