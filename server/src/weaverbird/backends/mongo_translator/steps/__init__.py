from collections.abc import Callable
from typing import Any

from weaverbird.backends.mongo_translator.steps.absolutevalue import translate_absolutevalue
from weaverbird.backends.mongo_translator.steps.addmissingdates import translate_addmissingdates
from weaverbird.backends.mongo_translator.steps.aggregate import translate_aggregate
from weaverbird.backends.mongo_translator.steps.append import translate_append
from weaverbird.backends.mongo_translator.steps.argmax import translate_argmax
from weaverbird.backends.mongo_translator.steps.argmin import translate_argmin
from weaverbird.backends.mongo_translator.steps.comparetext import translate_comparetext
from weaverbird.backends.mongo_translator.steps.concatenate import translate_concatenate
from weaverbird.backends.mongo_translator.steps.convert import translate_convert
from weaverbird.backends.mongo_translator.steps.cumsum import translate_cumsum
from weaverbird.backends.mongo_translator.steps.custom import translate_custom
from weaverbird.backends.mongo_translator.steps.date_extract import translate_date_extract
from weaverbird.backends.mongo_translator.steps.delete import translate_delete
from weaverbird.backends.mongo_translator.steps.domain import translate_domain
from weaverbird.backends.mongo_translator.steps.duplicate import translate_duplicate
from weaverbird.backends.mongo_translator.steps.duration import translate_duration
from weaverbird.backends.mongo_translator.steps.evolution import translate_evolution
from weaverbird.backends.mongo_translator.steps.fillna import translate_fillna
from weaverbird.backends.mongo_translator.steps.filter import translate_filter
from weaverbird.backends.mongo_translator.steps.formula import translate_formula
from weaverbird.backends.mongo_translator.steps.fromdate import translate_fromdate
from weaverbird.backends.mongo_translator.steps.ifthenelse import translate_ifthenelse
from weaverbird.backends.mongo_translator.steps.join import translate_join
from weaverbird.backends.mongo_translator.steps.lowercase import translate_lowercase
from weaverbird.backends.mongo_translator.steps.moving_average import translate_moving_average
from weaverbird.backends.mongo_translator.steps.percentage import translate_percentage
from weaverbird.backends.mongo_translator.steps.pivot import translate_pivot
from weaverbird.backends.mongo_translator.steps.rank import translate_rank
from weaverbird.backends.mongo_translator.steps.rename import translate_rename
from weaverbird.backends.mongo_translator.steps.replace import translate_replace
from weaverbird.backends.mongo_translator.steps.rollup import translate_rollup
from weaverbird.backends.mongo_translator.steps.select import translate_select
from weaverbird.backends.mongo_translator.steps.sort import translate_sort
from weaverbird.backends.mongo_translator.steps.split import translate_split
from weaverbird.backends.mongo_translator.steps.statistics import translate_statistics
from weaverbird.backends.mongo_translator.steps.substring import translate_substring
from weaverbird.backends.mongo_translator.steps.text import translate_text
from weaverbird.backends.mongo_translator.steps.todate import translate_todate
from weaverbird.backends.mongo_translator.steps.top import translate_top
from weaverbird.backends.mongo_translator.steps.totals import translate_totals
from weaverbird.backends.mongo_translator.steps.trim import translate_trim
from weaverbird.backends.mongo_translator.steps.uniquegroups import translate_uniquegroups
from weaverbird.backends.mongo_translator.steps.unpivot import translate_unpivot
from weaverbird.backends.mongo_translator.steps.uppercase import translate_uppercase
from weaverbird.backends.mongo_translator.steps.waterfall import translate_waterfall

# I would like to have a better type for the callable, but I don't know how to do it.
# each of this function take a particular step as input
# so it is not possible to use `Dict[str, Callable[[BaseStep], list]]
mongo_step_translator: dict[str, Callable[[Any], list]] = {
    "absolutevalue": translate_absolutevalue,
    "addmissingdates": translate_addmissingdates,
    "aggregate": translate_aggregate,
    "append": translate_append,
    "argmax": translate_argmax,
    "argmin": translate_argmin,
    "comparetext": translate_comparetext,
    "concatenate": translate_concatenate,
    "convert": translate_convert,
    "cumsum": translate_cumsum,
    "custom": translate_custom,
    "dateextract": translate_date_extract,
    "delete": translate_delete,
    "domain": translate_domain,
    "duplicate": translate_duplicate,
    "duration": translate_duration,
    "evolution": translate_evolution,
    "fillna": translate_fillna,
    "filter": translate_filter,
    "formula": translate_formula,
    "fromdate": translate_fromdate,
    "ifthenelse": translate_ifthenelse,
    "join": translate_join,
    "lowercase": translate_lowercase,
    "movingaverage": translate_moving_average,
    "percentage": translate_percentage,
    "pivot": translate_pivot,
    "rename": translate_rename,
    "rank": translate_rank,
    "replace": translate_replace,
    "rollup": translate_rollup,
    "select": translate_select,
    "sort": translate_sort,
    "split": translate_split,
    "statistics": translate_statistics,
    "substring": translate_substring,
    "text": translate_text,
    "todate": translate_todate,
    "totals": translate_totals,
    "top": translate_top,
    "trim": translate_trim,
    "uniquegroups": translate_uniquegroups,
    "unpivot": translate_unpivot,
    "uppercase": translate_uppercase,
    "waterfall": translate_waterfall,
}
