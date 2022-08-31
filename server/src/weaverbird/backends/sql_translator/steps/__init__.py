from ..types import SQLStepTranslator
from .aggregate import translate_aggregate
from .append import translate_append
from .argmax import translate_argmax
from .argmin import translate_argmin
from .concatenate import translate_concatenate
from .convert import translate_convert
from .cumsum import translate_cumsum
from .customsql import translate_customsql
from .dateextract import translate_dateextract
from .delete import translate_delete
from .duplicate import translate_duplicate
from .duration import translate_duration
from .evolution import translate_evolution
from .fillna import translate_fillna
from .filter import translate_filter
from .formula import translate_formula
from .fromdate import translate_fromdate
from .ifthenelse import translate_ifthenelse
from .join import translate_join
from .lowercase import translate_lowercase
from .percentage import translate_percentage
from .pivot import translate_pivot
from .rank import translate_rank
from .rename import translate_rename
from .replace import translate_replace
from .rollup import translate_rollup
from .select import translate_select
from .sort import translate_sort
from .split import translate_split
from .substring import translate_substring
from .table import translate_table
from .text import translate_text
from .todate import translate_todate
from .top import translate_top
from .totals import translate_totals
from .uniquegroups import translate_uniquegroups
from .unpivot import translate_unpivot
from .uppercase import translate_uppercase

sql_steps_translators: dict[str, SQLStepTranslator] = {
    "domain": translate_table,  # type ignore # TODO to update
    "filter": translate_filter,
    "aggregate": translate_aggregate,
    "select": translate_select,
    "ifthenelse": translate_ifthenelse,
    "sort": translate_sort,
    "rename": translate_rename,
    "convert": translate_convert,
    "text": translate_text,
    "lowercase": translate_lowercase,
    "uppercase": translate_uppercase,
    "fromdate": translate_fromdate,
    "todate": translate_todate,
    "formula": translate_formula,
    "replace": translate_replace,
    "join": translate_join,
    "uniquegroups": translate_uniquegroups,
    "top": translate_top,
    "percentage": translate_percentage,
    "unpivot": translate_unpivot,
    "pivot": translate_pivot,
    "dateextract": translate_dateextract,
    "append": translate_append,
    "concatenate": translate_concatenate,
    "delete": translate_delete,
    "rank": translate_rank,
    "split": translate_split,
    "substring": translate_substring,
    "fillna": translate_fillna,
    "customsql": translate_customsql,
    "argmax": translate_argmax,
    "argmin": translate_argmin,
    "duplicate": translate_duplicate,
    "evolution": translate_evolution,
    "duration": translate_duration,
    "rollup": translate_rollup,
    "cumsum": translate_cumsum,
    "totals": translate_totals,
}
