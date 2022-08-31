from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps.statistics import StatisticsStep


def _get_quantile(n: int, p: int) -> MongoStep:
    """Get n-th p-quantile.

    Examples:
    - the median is the first quantile of order 2.
    - the last decile is the 9-th quantile of order 10.
    """
    return {
        "$avg": [
            {
                "$arrayElemAt": [
                    "$data",
                    {
                        "$trunc": {
                            "$subtract": [{"$multiply": [{"$divide": ["$count", p]}, n]}, 1],
                        },
                    },
                ],
            },
            {
                "$arrayElemAt": [
                    "$data",
                    {
                        "$trunc": {"$multiply": [{"$divide": ["$count", p]}, n]},
                    },
                ],
            },
        ],
    }


def _need_to_compute_column_square(step: StatisticsStep) -> bool:
    return "variance" in step.statistics or "standard deviation" in step.statistics


def _need_to_compute_average(step: StatisticsStep) -> bool:
    return (
        "average" in step.statistics
        or "variance" in step.statistics
        or "standard deviation" in step.statistics
    )


def _need_to_sort(step: StatisticsStep) -> bool:
    return len(step.quantiles) > 0


def _need_to_count(step: StatisticsStep) -> bool:
    return len(step.quantiles) > 0 or "count" in step.statistics


# variance = avg(x^2) - avg(x)^2
_VARIANCE_FORMULA = {"$subtract": ["$average_sum_square", {"$pow": ["$average", 2]}]}

_STATISTICS_FORMULA = {
    "count": 1,
    "max": 1,
    "min": 1,
    "average": 1,
    "variance": _VARIANCE_FORMULA,
    "standard deviation": {"$pow": [_VARIANCE_FORMULA, 0.5]},
}


def translate_statistics(step: StatisticsStep) -> list[MongoStep]:
    return [
        {
            "$project": {
                **{col: 1 for col in step.groupby_columns},
                "column": f"${step.column}",
                **(
                    {"column_square": {"$pow": [f"${step.column}", 2]}}
                    if _need_to_compute_column_square(step)
                    else {}
                ),
            },
        },
        {
            "$match": {
                "column": {"$ne": None},
            },
        },
        *([{"$sort": {"column": 1}}] if _need_to_sort(step) else []),
        {
            "$group": {
                "_id": {col: f"${col}" for col in step.groupby_columns} or None,
                "data": {"$push": "$column"},
                **({"count": {"$sum": 1}} if _need_to_count(step) else {}),
                **({"max": {"$max": "$column"}} if "max" in step.statistics else {}),
                **({"min": {"$min": "$column"}} if "min" in step.statistics else {}),
                **(
                    {"average_sum_square": {"$avg": "$column_square"}}
                    if _need_to_compute_column_square(step)
                    else {}
                ),
                **({"average": {"$avg": "$column"}} if _need_to_compute_average(step) else {}),
            },
        },
        {
            "$project": {
                #  groupByColumn
                **{col: f"$_id.{col}" for col in step.groupby_columns},
                #  statistics
                **{statistic: _STATISTICS_FORMULA[statistic] for statistic in step.statistics},
                #  quantiles
                **{
                    quantile.label
                    if quantile.label
                    else f"{quantile.nth}-th {quantile.order}-quantile": _get_quantile(
                        quantile.nth, quantile.order
                    )
                    for quantile in step.quantiles
                },
            },
        },
    ]
