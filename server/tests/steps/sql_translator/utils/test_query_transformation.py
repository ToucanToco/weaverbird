import pytest

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    apply_condition,
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
    assert "" == snowflake_date_format("")


def test_ignore_none_date_format():
    assert ", 'badaboum'" == snowflake_date_format('badaboum')
