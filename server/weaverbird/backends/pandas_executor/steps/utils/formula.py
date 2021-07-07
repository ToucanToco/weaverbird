import re

from pandas import DataFrame

COLUMN_PATTERN = re.compile(r'(\`[^\`]*\`)')


# In pandas, columns containing spaces must be escaped with backticks:
def clean_formula_element(elem: str) -> str:
    if COLUMN_PATTERN.match(elem):
        # this is a column name: return it as is
        return elem
    # - forbid '=' char
    # - replace [ and ] with `
    #   ([] is mongo's syntax to escape columns containing spaces)
    return elem.replace('=', '').replace('[', '`').replace(']', '`')


def clean_formula(formula: str) -> str:
    """
    Translate mongo's syntax to hande columns names containing spaces to pandas syntax.

    Example:
        >>> clean_formula('colA * `col B` * [col C] * `[col D]`')
        'colA * `col B` * `col C` * `[col D]`'
    """
    formula_splitted = COLUMN_PATTERN.split(formula)
    return ''.join(clean_formula_element(elem) for elem in formula_splitted)


def eval_formula(df: DataFrame, formula: str) -> DataFrame:
    try:
        return df.eval(formula)
    except Exception:
        # for all cases not handled by NumExpr
        return df.eval(formula, engine='python')
