from ..types import StepExecutor
from .absolutevalue import execute_absolutevalue
from .addmissingdates import execute_addmissingdates
from .aggregate import execute_aggregate
from .append import execute_append
from .argmax import execute_argmax
from .argmin import execute_argmin
from .comparetext import execute_comparetext
from .concatenate import execute_concatenate
from .convert import execute_convert
from .cumsum import execute_cumsum
from .date_extract import execute_date_extract
from .delete import execute_delete
from .dissolve import execute_dissolve
from .domain import execute_domain
from .duplicate import execute_duplicate
from .duration import execute_duration
from .evolution import execute_evolution
from .fillna import execute_fillna
from .filter import execute_filter
from .formula import execute_formula
from .fromdate import execute_fromdate
from .hierarchy import execute_hierarchy
from .ifthenelse import execute_ifthenelse
from .join import execute_join
from .lowercase import execute_lowercase
from .moving_average import execute_moving_average
from .percentage import execute_percentage
from .pivot import execute_pivot
from .rank import execute_rank
from .rename import execute_rename
from .replace import execute_replace
from .rollup import execute_rollup
from .select import execute_select
from .simplify import execute_simplify
from .sort import execute_sort
from .split import execute_split
from .statistics import execute_statistics
from .substring import execute_substring
from .text import execute_text
from .todate import execute_todate
from .top import execute_top
from .totals import execute_totals
from .trim import execute_trim
from .uniquegroups import execute_uniquegroups
from .unpivot import execute_unpivot
from .uppercase import execute_uppercase
from .waterfall import execute_waterfall

steps_executors: dict[str, StepExecutor] = {
    "absolutevalue": execute_absolutevalue,
    "addmissingdates": execute_addmissingdates,
    "aggregate": execute_aggregate,
    "append": execute_append,  # type: ignore
    "argmax": execute_argmax,
    "argmin": execute_argmin,
    "comparetext": execute_comparetext,
    "concatenate": execute_concatenate,
    "convert": execute_convert,
    "cumsum": execute_cumsum,
    "dateextract": execute_date_extract,
    "delete": execute_delete,
    "dissolve": execute_dissolve,
    "domain": execute_domain,  # type: ignore
    "duplicate": execute_duplicate,
    "duration": execute_duration,
    "evolution": execute_evolution,
    "fillna": execute_fillna,
    "filter": execute_filter,
    "formula": execute_formula,
    "fromdate": execute_fromdate,
    "hierarchy": execute_hierarchy,
    "ifthenelse": execute_ifthenelse,
    "join": execute_join,  # type: ignore
    "lowercase": execute_lowercase,
    "movingaverage": execute_moving_average,
    "percentage": execute_percentage,
    "pivot": execute_pivot,
    "rank": execute_rank,
    "rename": execute_rename,
    "replace": execute_replace,
    "rollup": execute_rollup,
    "select": execute_select,
    "simplify": execute_simplify,
    "sort": execute_sort,
    "split": execute_split,
    "statistics": execute_statistics,
    "substring": execute_substring,
    "text": execute_text,
    "todate": execute_todate,
    "top": execute_top,
    "totals": execute_totals,
    "trim": execute_trim,
    "uniquegroups": execute_uniquegroups,
    "unpivot": execute_unpivot,
    "uppercase": execute_uppercase,
    "waterfall": execute_waterfall,
}
