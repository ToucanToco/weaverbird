"""

A formula builder module for all our backends

"""
import ast
import re
from typing import Any

from weaverbird.pipeline.steps import FormulaStep, formula


class InvalidFormula(Exception):
    """
    Raised when a formula is not supported
    """


class ColumnBuilder:
    """
    A column delemiter module

    As default, the suffix is the same as the prefix
    so that if prefix is ", we could end with "col"

    Also called as QUOTE_CHAR, these characters (prefix/suffix) will delimit
    our columns.

    Examples:
    In [2]: ColumnBuilder('"', 'test')
    Out[2]: '"test"'

    In [3]: ColumnBuilder('$', 'test')
    Out[3]: '$test'

    In [4]: ColumnBuilder('${', 'test')
    Out[4]: '${test}'

    In [5]: ColumnBuilder('[', 'test')
    Out[5]: '[test]'
    """

    ENCLOSING = {'`': '`', '"': '"', '\'': '\'', '${': '}', '$(': ')', '[': ']', '{': '}', '(': ')'}

    def __init__(self, prefix: str, column_name: str, suffix: str | None = None) -> None:
        self.prefix = prefix
        self.column_name = column_name
        self.suffix = self._build_suffix(self.prefix, suffix)

    def _build_suffix(self, prefix: str, suffix: str | None) -> str:
        return self.ENCLOSING.get(prefix, '') if not suffix else suffix

    def __str__(self) -> str:
        """For a given column_name render with enclosures"""
        return f'{self.prefix}{self.column_name}{self.suffix}'

    def __repr__(self) -> str:
        """For a given column_name render with enclosures"""
        return f'{self.prefix}{self.column_name}{self.suffix}'

    def __add__(self, other) -> str:
        return self.__str__() + other

    def __radd__(self, other) -> str:
        return self.__str__() + other


class FormulaBuilder:
    """
    The formula builder class to construct a valid formula for our backend

    These are some examples for the input formula :
    Ex : '1 - "3" / 12 - 5 / askk'

    In [0]: FormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[0]: '  1 -  3 / 12 -  5 / askk'

    In [1]: SqlFormulaBuilder.sanitize_formula('1 - "3" / 12 - 5 / askk')
    Out[1]: ({}, '1 - 3 / NULLIF(12, 0) - 5 / NULLIF("askk", 0)')

    In [2]: SnowflakeFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[2]: "1 - 3 / NULLIF(12, 0) - 5 / NULLIF('askk', 0)"

    In [3]: MysqlFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[3]: '1 - 3 / NULLIF(12, 0) - 5 / NULLIF(`askk`, 0)'

    In [4]: AthenaFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[4]: '1 - 3 / NULLIF(12, 0) - 5 / NULLIF("askk", 0)'

    In [5]: GoogleBigqueryFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[5]: '1 - 3 / NULLIF(12, 0) - 5 / NULLIF(`askk`, 0)'

    In [6]: PandasFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[6]: <ast.Expr at 0x..........>

    In [7]: MongoFormulaBuilder.build_formula_tree('1 - "3" / 12 - 5 / askk')
    Out[7]: {
       "$subtract":[
          {
             "$subtract":[
                1,
                {
                   "$cond":[
                      { "$in":[ 12, [ 0, "None" ] ] },
                      "None",
                      { "$divide":[ "3", 12 ] }
                   ]
                }
             ]
          },
          {
             "$cond":[
                { "$in":[ "$askk", [ 0, "None" ] ] },
                "None",
                { "$divide":[ 5, "$askk" ] }
             ]
          }
       ]
    }

    """

    # ARITHMETIC  - BASED OPERATORS
    # add operation +
    ADD_OP: str = '+'
    # substract operation -
    SUBSTRACT_OP: str = '-'
    # multiplication operation *
    MULTIPLY_OP: str = '+'
    # modulo from a division %
    MODULO_OP: str = '%'
    # float division /
    DIVIDE_OP: str = '/'
    # power operation ^
    POW_OP: str = '^'

    # The character that will be used to encapsulate columns
    QUOTE_CHAR: str = ''

    @classmethod
    def clean_extras_spaces_and_tabs(cls, _str) -> str:
        return ' '.join(_str.strip().split(' '))

    @classmethod
    def _node_as_constant(cls, constant: ast.Constant, columns_aliases: dict | None = None) -> Any:
        return constant.value

    @classmethod
    def _node_as_name(cls, name: ast.Name, columns_aliases: dict | None = None) -> str:
        """
        Identifiers correspond to column names
        """
        return str(ColumnBuilder(cls.QUOTE_CHAR, name.id))

    @classmethod
    def _node_as_binop(cls, binop: ast.BinOp, columns_aliases: dict | None = None) -> Any:

        binop_str = (
            f" {cls._node_as_ast(binop.left, columns_aliases)}"
            f" {cls.get_op(binop)}"
            f" {cls._node_as_ast(binop.right, columns_aliases)}"
        )

        return binop_str

    @classmethod
    def _node_as_unaryop(cls, unop: ast.UnaryOp, columns_aliases: dict | None = None) -> Any:

        unary_operator_str = {
            'ast.USub': cls._node_as_ast,
        }

        try:
            return unary_operator_str[str(type(unop.op))](unop.operand, columns_aliases)
        except Exception as excp:
            raise InvalidFormula(f'Operator {unop.op.__class__} is not supported') from excp

    @classmethod
    def _node_as_expr(
        cls, expr: ast.Expr, columns_aliases: dict | None = None
    ) -> dict[str, Any] | Any:

        if isinstance(expr.value, ast.AST):
            return cls._node_as_ast(expr.value, columns_aliases)
        else:
            raise InvalidFormula

    @classmethod
    def _node_as_ast(cls, node: ast.AST, columns_aliases: dict | None = None) -> Any:

        formula_form = {
            'BinOp': cls._node_as_binop,
            'UnaryOp': cls._node_as_unaryop,
            'Constant': cls._node_as_constant,
            'Name': cls._node_as_name,
        }

        try:
            formula_node_func = formula_form[type(node).__name__]
            return formula_node_func(node, columns_aliases)  # type: ignore
        except IndexError as excp:
            raise InvalidFormula(f'Formula node {node} is not supported') from excp

    @classmethod
    def get_op(cls, binop: ast.BinOp) -> str:

        operator_str = {
            'Add': cls.ADD_OP,
            'Sub': cls.SUBSTRACT_OP,
            'Mult': cls.MULTIPLY_OP,
            'Div': cls.DIVIDE_OP,
            'Pow': cls.POW_OP,
        }

        try:
            return operator_str[type(binop.op).__name__]
        except IndexError as excp:
            raise InvalidFormula(f'Operator {binop.op.__class__} is not supported') from excp

    @classmethod
    def translate_formula(cls, step: FormulaStep) -> Any:
        return formula

    @classmethod
    def sanitize_formula(cls, formula: str) -> Any:
        return {}, formula

    @classmethod
    def build_formula_tree(
        cls, formula: str | int | float | bool, quote_char: str | None = None
    ) -> Any:

        if quote_char:
            cls.QUOTE_CHAR = quote_char

        if isinstance(formula, str):
            columns_aliases, sanitized_formula = cls.sanitize_formula(formula)

            # since it's a none recognized character by ast
            if '`' not in sanitized_formula and not issubclass(cls, SqlFormulaBuilder):
                module = ast.parse(sanitized_formula)
                expr = module.body[0]
                if not isinstance(expr, ast.Expr):
                    raise InvalidFormula
            else:
                expr = sanitized_formula

            if issubclass(cls, MongoFormulaBuilder):
                built_expr = cls._node_as_expr(expr, columns_aliases)  # type: ignore
            else:
                built_expr = expr

            return built_expr
        elif type(formula) in (int, float, bool):
            return formula
        else:
            raise InvalidFormula


class MongoFormulaBuilder(FormulaBuilder):

    ADD_OP = '$add'
    SUBSTRACT_OP = '$subtract'
    MULTIPLY_OP = '$multiply'
    MODULO_OP = '$mod'
    DIVIDE_OP = '$divide'
    POW_OP = '$pow'

    QUOTE_CHAR = '$'

    @classmethod
    def _node_as_name(cls, name: ast.Name, columns_aliases: dict | None = None) -> str:

        if columns_aliases:
            key_name = name.id

            if key_name in columns_aliases:
                return str(ColumnBuilder('${', columns_aliases[key_name]))

        return super()._node_as_name(name, columns_aliases)

    @classmethod
    def _node_as_unaryop(cls, unop: ast.UnaryOp, columns_aliases: dict | None = None) -> Any:

        if isinstance(unop.op, ast.USub):
            return {'$multiply': [-1, cls._node_as_ast(unop.operand, columns_aliases)]}

        raise InvalidFormula(f'Operator {unop.op.__class__} is not supported')

    @classmethod
    def _node_as_binop(cls, binop: ast.BinOp, columns_aliases: dict | None = None) -> Any:

        binop_as_str: str = cls.get_op(binop)

        translated_op = {
            binop_as_str: [
                cls._node_as_ast(binop.left, columns_aliases),
                cls._node_as_ast(binop.right, columns_aliases),
            ]
        }
        #  In case of a division operation the translator must handle a 0 or null denominator.
        #  The implemented logic is: if the translated operation is a division, wraps the operation with a
        #  condition checking if the value of the right operand is in 0 or None and output a None result in this case
        #  otherwise, return the result the division operation
        if binop_as_str == cls.DIVIDE_OP:
            return {
                '$cond': [
                    {'$in': [cls._node_as_ast(binop.right, columns_aliases), [0, None]]},
                    None,
                    translated_op,
                ]
            }

        return translated_op

    @classmethod
    def translate_formula(cls, step: FormulaStep) -> Any:
        return [{'$addFields': {step.new_column: cls.build_formula_tree(step.formula)}}]

    @classmethod
    def sanitize_formula(cls, formula: str) -> Any:
        """
        This function handles column names with special characters & spaces.
        Such columns are surrounded by brackets. The functions replaces this pattern by a temporary name
        and store the original name in a dict, with the temporary name as key and the actual name as key.
        For example in this formula -> [I'm a Special Column!!] * 10 it will return
        tuple(__vqb_col_0__ * 10, {"__vqb_col_0__": "[I'm a Special Column!!]"})
        The translate function will replaces the temporary name by the old one once the formula will
        be parsed by ast.parse and translated to mongo.
        """
        columns_aliases = {}
        sanitized_formula = cls.clean_extras_spaces_and_tabs(formula)
        matches = re.findall(r'\[(.*?)]', formula)
        for i, match in enumerate(matches):
            columns_aliases[f'__vqb_col_{i}__'] = match
            sanitized_formula = sanitized_formula.replace(f'[{match}]', f'__vqb_col_{i}__')
        return columns_aliases, sanitized_formula


class SqlFormulaBuilder(FormulaBuilder):
    QUOTE_CHAR = '"'

    @classmethod
    def translate_formula(cls, step: FormulaStep) -> Any:
        return cls.build_formula_tree(step.formula)

    @classmethod
    def sanitize_formula(cls, formula: str) -> Any:
        """
        These combined regexes will :
            - remove and replace quotes & brackets with the ones
              corresponding to the translator.
            - prevent division by zero by adding NULLIF on all division
              expression.
        Exemple of a weird expression : 'cost' + (`price_per_l` / [alcohol_degree]) / (\"price_per_l\" + [volume_ml]) / 0
        The sanitizer will return : "cost" + ("price_per_l"/ NULLIF("alcohol_degree", 0))/("price_per_l" + "volume_ml")/ NULLIF(0, 0)
        """
        formula = cls.clean_extras_spaces_and_tabs(formula)
        # We remove enclosures and double spaces
        formula = re.sub(r'[\[\]]|["]|[`]|[\']', '', formula)
        # We add quote from the translator
        formula = re.sub(
            r'([a-zA-Z_a-zA-Z]+)',
            r'{}\1{}'.format(cls.QUOTE_CHAR, cls.QUOTE_CHAR),
            formula,
        )
        # detect and encapsulate / and %
        for cha in ['/', '%']:
            if cha in formula:
                formula = re.sub(
                    r'((?<={})\{}?\w+\{}?)|((?<=/)\d+)|((?<=/)\(?.*\)?)'.format(
                        cha, cls.QUOTE_CHAR, cls.QUOTE_CHAR
                    ),
                    r' NULLIF(\1\2\3, 0)',
                    formula.replace(f'{cha} ', cha),
                )

        return {}, formula


class PostgresqlFormulaBuilder(SqlFormulaBuilder):
    """FormulaBuilder class for postgresql and RedshiftSql"""

    ...


class AthenaFormulaBuilder(SqlFormulaBuilder):
    """FormulaBuilder class for Athena"""

    ...


class SnowflakeFormulaBuilder(SqlFormulaBuilder):
    """FormulaBuilder class for Snowflake"""

    QUOTE_CHAR = "\'"
    ...


class MysqlFormulaBuilder(SqlFormulaBuilder):
    """FormulaBuilder class for MySql"""

    QUOTE_CHAR = '`'
    ...


class GoogleBigqueryFormulaBuilder(SqlFormulaBuilder):
    """FormulaBuilder class for GoogleBigQuery"""

    QUOTE_CHAR = "`"
    ...


class PandasFormulaBuilder(FormulaBuilder):
    """FormulaBuilder class for Pandas backend"""

    ...
