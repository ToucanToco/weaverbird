from typing import Dict

from ..types import StepExecutor
from .addmissingdates import execute_addmissingdates
from .aggregate import execute_aggregate
from .append import execute_append

# from .argmax import execute as execute_argmax
# from .argmin import execute as execute_argmin
# from .comparetext import execute as execute_comparetext
# from .concatenate import execute as execute_concatenate
# from .convert import execute as execute_convert
# from .cumsum import execute as execute_cumsum
# from .date_extract import execute as execute_date_extract
# from .delete import execute as execute_delete
# from .domain import execute as execute_domain
# from .duplicate import execute as execute_duplicate
# from .duration import execute as execute_duration
# from .evolution import execute as execute_evolution
# from .fillna import execute as execute_fillna
# from .filter import execute as execute_filter
# from .formula import execute as execute_formula
# from .fromdate import execute as execute_fromdate
# from .ifthenelse import execute as execute_ifthenelse
# from .join import execute as execute_join
# from .lowercase import execute as execute_lowercase
# from .moving_average import execute as execute_moving_average
# from .percentage import execute as execute_percentage
# from .pivot import execute as execute_pivot
# from .rank import execute as execute_rank
# from .rename import execute as execute_rename
# from .replace import execute as execute_replace
# from .rollup import execute as execute_rollup
# from .select import execute as execute_select
# from .sort import execute as execute_sort
# from .split import execute as execute_split
# from .statistics import execute as execute_statistics
# from .substring import execute as execute_substring
# from .text import execute as execute_text
# from .todate import execute as execute_todate
# from .top import execute as execute_top
# from .totals import execute as execute_totals
# from .uniquegroups import execute as execute_uniquegroups
# from .unpivot import execute as execute_unpivot
# from .uppercase import execute as execute_uppercase
# from .waterfall import execute as execute_waterfall

steps_executors: Dict[str, StepExecutor] = {
    'addmissingdates': execute_addmissingdates,
    'aggregate': execute_aggregate,
    'append': execute_append,
    # 'argmax': execute_argmax,
    # 'argmin': execute_argmin,
    # 'comparetext': execute_comparetext,
    # 'concatenate': execute_concatenate,
    # 'convert': execute_convert,
    # 'cumsum': execute_cumsum,
    # 'date_extract': execute_date_extract,
    # 'delete': execute_delete,
    # 'domain': execute_domain,
    # 'duplicate': execute_duplicate,
    # 'duration': execute_duration,
    # 'evolution': execute_evolution,
    # 'fillna': execute_fillna,
    # 'filter': execute_filter,
    # 'formula': execute_formula,
    # 'fromdate': execute_fromdate,
    # 'ifthenelse': execute_ifthenelse,
    # 'join': execute_join,
    # 'lowercase': execute_lowercase,
    # 'moving_average': execute_moving_average,
    # 'percentage': execute_percentage,
    # 'pivot': execute_pivot,
    # 'rank': execute_rank,
    # 'rename': execute_rename,
    # 'replace': execute_replace,
    # 'rollup': execute_rollup,
    # 'select': execute_select,
    # 'sort': execute_sort,
    # 'split': execute_split,
    # 'statistics': execute_statistics,
    # 'substring': execute_substring,
    # 'text': execute_text,
    # 'todate': execute_todate,
    # 'top': execute_top,
    # 'totals': execute_totals,
    # 'uniquegroups': execute_uniquegroups,
    # 'unpivot': execute_unpivot,
    # 'uppercase': execute_uppercase,
    # 'waterfall': execute_waterfall,
}
