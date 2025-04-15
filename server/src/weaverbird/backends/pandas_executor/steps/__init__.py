from weaverbird.backends.pandas_executor.steps.absolutevalue import execute_absolutevalue
from weaverbird.backends.pandas_executor.steps.addmissingdates import execute_addmissingdates
from weaverbird.backends.pandas_executor.steps.aggregate import execute_aggregate
from weaverbird.backends.pandas_executor.steps.append import execute_append
from weaverbird.backends.pandas_executor.steps.argmax import execute_argmax
from weaverbird.backends.pandas_executor.steps.argmin import execute_argmin
from weaverbird.backends.pandas_executor.steps.comparetext import execute_comparetext
from weaverbird.backends.pandas_executor.steps.concatenate import execute_concatenate
from weaverbird.backends.pandas_executor.steps.convert import execute_convert
from weaverbird.backends.pandas_executor.steps.cumsum import execute_cumsum
from weaverbird.backends.pandas_executor.steps.date_extract import execute_date_extract
from weaverbird.backends.pandas_executor.steps.date_granularity import execute_date_granularity
from weaverbird.backends.pandas_executor.steps.delete import execute_delete
from weaverbird.backends.pandas_executor.steps.dissolve import execute_dissolve
from weaverbird.backends.pandas_executor.steps.domain import execute_domain
from weaverbird.backends.pandas_executor.steps.duplicate import execute_duplicate
from weaverbird.backends.pandas_executor.steps.duration import execute_duration
from weaverbird.backends.pandas_executor.steps.evolution import execute_evolution
from weaverbird.backends.pandas_executor.steps.fillna import execute_fillna
from weaverbird.backends.pandas_executor.steps.filter import execute_filter
from weaverbird.backends.pandas_executor.steps.formula import execute_formula
from weaverbird.backends.pandas_executor.steps.fromdate import execute_fromdate
from weaverbird.backends.pandas_executor.steps.hierarchy import execute_hierarchy
from weaverbird.backends.pandas_executor.steps.ifthenelse import execute_ifthenelse
from weaverbird.backends.pandas_executor.steps.join import execute_join
from weaverbird.backends.pandas_executor.steps.lowercase import execute_lowercase
from weaverbird.backends.pandas_executor.steps.moving_average import execute_moving_average
from weaverbird.backends.pandas_executor.steps.percentage import execute_percentage
from weaverbird.backends.pandas_executor.steps.pivot import execute_pivot
from weaverbird.backends.pandas_executor.steps.rank import execute_rank
from weaverbird.backends.pandas_executor.steps.rename import execute_rename
from weaverbird.backends.pandas_executor.steps.replace import execute_replace
from weaverbird.backends.pandas_executor.steps.replacetext import execute_replacetext
from weaverbird.backends.pandas_executor.steps.rollup import execute_rollup
from weaverbird.backends.pandas_executor.steps.select import execute_select
from weaverbird.backends.pandas_executor.steps.simplify import execute_simplify
from weaverbird.backends.pandas_executor.steps.sort import execute_sort
from weaverbird.backends.pandas_executor.steps.split import execute_split
from weaverbird.backends.pandas_executor.steps.statistics import execute_statistics
from weaverbird.backends.pandas_executor.steps.substring import execute_substring
from weaverbird.backends.pandas_executor.steps.text import execute_text
from weaverbird.backends.pandas_executor.steps.todate import execute_todate
from weaverbird.backends.pandas_executor.steps.top import execute_top
from weaverbird.backends.pandas_executor.steps.totals import execute_totals
from weaverbird.backends.pandas_executor.steps.trim import execute_trim
from weaverbird.backends.pandas_executor.steps.uniquegroups import execute_uniquegroups
from weaverbird.backends.pandas_executor.steps.unpivot import execute_unpivot
from weaverbird.backends.pandas_executor.steps.uppercase import execute_uppercase
from weaverbird.backends.pandas_executor.steps.waterfall import execute_waterfall
from weaverbird.backends.pandas_executor.types import StepExecutor

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
    "dategranularity": execute_date_granularity,
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
    "replacetext": execute_replacetext,
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
