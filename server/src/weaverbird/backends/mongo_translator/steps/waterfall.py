from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import WaterfallStep
from weaverbird.pipeline.steps.waterfall import GROUP_WATERFALL_COLUMN

_VQB_ALL_KEYS = "_vqbAllKeys"
_VQB_START_KEYS = "_vqbStartKeys"
_VQB_END_KEYS = "_vqbEndKeys"
_VQB_START_ELEMENTS = "_vqbStartElements"
_VQB_END_ELEMENTS = "_vqbEndElements"
_VQB_CHILDREN = "_vqbChildren"
_VQB_PARENTS = "_vqbParents"
_VQB_KEYS_TO_KEEP = "_vqbKeysToKeep"
_VQB_START = "_vqbStart"
_VQB_END = "_vqbEnd"
_VQB_RESULTS = "_vqbResults"
_VQB_ORDER = "_vqbOrder"


def _facet_keys_and_elements(step: WaterfallStep, *, group_key: list[str], project_key: list[str]) -> list[MongoStep]:
    """Facets the input document in order to get:

    * A list of all existing group keys
    * A list of all existing group keys for start and end elements
    * A list of all start elements
    * A list of all end elements
    """

    # fields to keep for start and end element keys
    start_end_key_projection_fields = {
        "_id": False,
        **{col: f"$_id.{col}" for col in group_key + [step.milestonesColumn]},
    }
    # fields to keep for start and end elements
    start_end_projection_fields = {
        # We store the group key in the ID for later filtering
        "_id": {col: f"$_id.{col}" for col in group_key},
        **{col: f"$_id.{col}" for col in project_key if col != "_id"},
    }

    return [
        {
            "$facet": {
                _VQB_ALL_KEYS: [
                    {"$match": {step.milestonesColumn: {"$in": [step.start, step.end]}}},
                    {"$group": {"_id": _column_map(group_key)}},
                    {"$project": {"_id": False, **{col: f"$_id.{col}" for col in group_key}}},
                ],
                _VQB_START_KEYS: [
                    {"$match": {step.milestonesColumn: step.start}},
                    {"$group": {"_id": _column_map(group_key)}},
                    {"$project": start_end_key_projection_fields},
                ],
                _VQB_START_ELEMENTS: [
                    {"$match": {step.milestonesColumn: step.start}},
                    {"$group": {"_id": _column_map(project_key)}},
                    {"$project": start_end_projection_fields},
                ],
                _VQB_END_KEYS: [
                    {"$match": {step.milestonesColumn: step.end}},
                    {"$group": {"_id": _column_map(group_key)}},
                    {"$project": start_end_key_projection_fields},
                ],
                _VQB_END_ELEMENTS: [
                    {"$match": {step.milestonesColumn: step.end}},
                    {"$group": {"_id": _column_map(project_key)}},
                    {"$project": start_end_projection_fields},
                ],
            }
        }
    ]


def _filter_out_incomplete_elements(*, group_key: list[str], project_key: list[str]) -> list[MongoStep]:
    """Filters out elements which do not have a start and end value"""
    return [
        # Determining which keys should be kept: We only what those with a start and end value
        {"$addFields": {_VQB_KEYS_TO_KEEP: {"$setIntersection": [f"${_VQB_START_KEYS}", f"${_VQB_END_KEYS}"]}}},
        # filtering start and elements on keys that should be kept
        {
            "$project": {
                _VQB_START_ELEMENTS: {
                    "$filter": {
                        "input": f"${_VQB_START_ELEMENTS}",
                        "cond": {"$in": ["$$this._id", f"${_VQB_KEYS_TO_KEEP}"]},
                    }
                },
                _VQB_END_ELEMENTS: {
                    "$filter": {
                        "input": f"${_VQB_END_ELEMENTS}",
                        "cond": {"$in": ["$$this._id", f"${_VQB_KEYS_TO_KEEP}"]},
                    }
                },
            }
        },
    ]


def _backfill_missing_values(step: WaterfallStep, *, group_key: list[str], project_key: list[str]) -> list[MongoStep]:
    """Backfills the missing start and end values."""
    mongo_step = {
        "$project": {
            _VQB_START_ELEMENTS: {
                # Concatenating the actual start keys + the backfilled ones
                "$concatArrays": [
                    f"${_VQB_START_ELEMENTS}",
                    # building the backfilled elements: mapping over the missing keys and adding the
                    # label + the value
                    {
                        "$map": {
                            # Determining the missing keys by doing a set difference between all
                            # keys and the start keys
                            "input": {"$setDifference": [f"${_VQB_ALL_KEYS}", f"${_VQB_START_KEYS}"]},
                            "in": {
                                "$mergeObjects": [
                                    "$$this",
                                    {step.milestonesColumn: step.start, step.valueColumn: 0},
                                ]
                            },
                        }
                    },
                ]
            },
            _VQB_END_ELEMENTS: {
                "$concatArrays": [
                    f"${_VQB_END_ELEMENTS}",
                    {
                        "$map": {
                            "input": {"$setDifference": [f"${_VQB_ALL_KEYS}", f"${_VQB_END_KEYS}"]},
                            "in": {
                                "$mergeObjects": [
                                    "$$this",
                                    {step.milestonesColumn: step.start, step.valueColumn: 0},
                                ]
                            },
                        }
                    },
                ]
            },
        }
    }
    return [mongo_step]


def _calculate_children_deltas(step: WaterfallStep) -> list[MongoStep]:
    """Calculates the deltas between the start and the end of every element.

    The deltas are added to a new field.
    """
    mongo_step = {
        "$addFields": {
            _VQB_CHILDREN: {
                # Iterating over a zip op (end_element, start_element) pairs
                "$map": {
                    "input": {"$zip": {"inputs": [f"${_VQB_END_ELEMENTS}", f"${_VQB_START_ELEMENTS}"]}},
                    "in": {
                        # Here, we are merging the start object with another object containg the
                        # value column with the start element's value subtracted from the end
                        # element's value
                        "$mergeObjects": [
                            {"$arrayElemAt": ["$$this", 0]},
                            {
                                step.valueColumn: {
                                    "$subtract": [
                                        {
                                            "$getField": {
                                                "field": step.valueColumn,
                                                "input": {"$arrayElemAt": ["$$this", 0]},
                                            }
                                        },
                                        {
                                            "$getField": {
                                                "field": step.valueColumn,
                                                "input": {"$arrayElemAt": ["$$this", 1]},
                                            }
                                        },
                                    ]
                                }
                            },
                        ]
                    },
                }
            }
        }
    }
    return [mongo_step]


def _sort_elements(*, group_key: list[str], project_key: list[str]) -> list[MongoStep]:
    # FIXME: this should be $sortArray once we can use mongo>=5.2
    return [
        {
            "$facet": {
                _VQB_START_ELEMENTS: [
                    {"$unwind": {"path": f"${_VQB_START_ELEMENTS}"}},
                    {"$sort": {f"{_VQB_START_ELEMENTS}.{col}": 1 for col in group_key}},
                    {"$project": {col: f"${_VQB_START_ELEMENTS}.{col}" for col in project_key}},
                ],
                _VQB_END_ELEMENTS: [
                    {"$unwind": {"path": f"${_VQB_END_ELEMENTS}"}},
                    {"$sort": {f"{_VQB_END_ELEMENTS}.{col}": 1 for col in group_key}},
                    {"$project": {col: f"${_VQB_END_ELEMENTS}.{col}" for col in project_key}},
                ],
            }
        },
    ]


def _facet_results(step: WaterfallStep) -> list[MongoStep]:
    children_group = step.groupby + [step.labelsColumn] + ([step.parentsColumn] if step.parentsColumn else [])
    facet: dict[str, list] = {
        _VQB_CHILDREN: [
            {"$unwind": f"${_VQB_CHILDREN}"},
            {
                "$group": {
                    "_id": {col: f"${_VQB_CHILDREN}.{col}" for col in children_group},
                    step.valueColumn: {"$sum": f"${_VQB_CHILDREN}.{step.valueColumn}"},
                }
            },
            {
                "$project": {
                    **{col: f"$_id.{col}" for col in step.groupby},
                    "LABEL_waterfall": f"$_id.{step.labelsColumn}",
                    **({"GROUP_waterfall": f"$_id.{step.parentsColumn}"} if step.parentsColumn else {}),
                    "TYPE_waterfall": "child" if step.parentsColumn else "parent",
                    step.valueColumn: f"${step.valueColumn}",
                    _VQB_ORDER: {"$literal": 1},
                }
            },
        ],
        _VQB_START: [
            {"$unwind": f"${_VQB_START_ELEMENTS}"},
            {
                "$group": {
                    "_id": {col: f"${_VQB_START_ELEMENTS}.{col}" for col in step.groupby} if step.groupby else True,
                    step.valueColumn: {"$sum": f"${_VQB_START_ELEMENTS}.{step.valueColumn}"},
                }
            },
            {
                "$project": {
                    **{col: f"$_id.{col}" for col in step.groupby},
                    "LABEL_waterfall": {"$literal": str(step.start)},
                    "GROUP_waterfall": {"$literal": str(step.start)},
                    "TYPE_waterfall": None,
                    step.valueColumn: f"${step.valueColumn}",
                    _VQB_ORDER: {"$literal": 0},
                },
            },
        ],
        _VQB_END: [
            {"$unwind": f"${_VQB_END_ELEMENTS}"},
            {
                "$group": {
                    "_id": {col: f"${_VQB_END_ELEMENTS}.{col}" for col in step.groupby} if step.groupby else True,
                    step.valueColumn: {"$sum": f"${_VQB_END_ELEMENTS}.{step.valueColumn}"},
                }
            },
            {
                "$project": {
                    **{col: f"$_id.{col}" for col in step.groupby},
                    "LABEL_waterfall": {"$literal": str(step.end)},
                    "GROUP_waterfall": {"$literal": str(step.end)},
                    "TYPE_waterfall": None,
                    step.valueColumn: f"${step.valueColumn}",
                    _VQB_ORDER: {"$literal": 3},
                },
            },
        ],
    }

    if step.parentsColumn:
        facet[_VQB_PARENTS] = [
            {"$unwind": f"${_VQB_CHILDREN}"},
            {
                "$group": {
                    "_id": {col: f"${_VQB_CHILDREN}.{col}" for col in (step.groupby + [step.parentsColumn])},
                    step.valueColumn: {"$sum": f"${_VQB_CHILDREN}.{step.valueColumn}"},
                }
            },
            {
                "$project": {
                    **{col: f"$_id.{col}" for col in step.groupby},
                    "LABEL_waterfall": f"$_id.{step.parentsColumn}",
                    "GROUP_waterfall": f"$_id.{step.parentsColumn}",
                    "TYPE_waterfall": "parent",
                    step.valueColumn: f"${step.valueColumn}",
                    "_id": False,
                    _VQB_ORDER: {"$literal": 2},
                },
            },
        ]
    return [{"$facet": facet}]


def _unwind_results(step: WaterfallStep) -> list[MongoStep]:
    to_concat = [_VQB_START, _VQB_CHILDREN, _VQB_END]
    if step.parentsColumn:
        to_concat.append(_VQB_PARENTS)

    return [
        {"$project": {_VQB_RESULTS: {"$concatArrays": [f"${col}" for col in to_concat]}}},
        {"$unwind": f"${_VQB_RESULTS}"},
        {"$replaceRoot": {"newRoot": f"${_VQB_RESULTS}"}},
    ]


def _column_map(colnames: list[str]) -> dict[str, str]:
    return {col: f"${col}" for col in colnames}


def translate_waterfall(step: WaterfallStep) -> list[MongoStep]:
    group_key = step.groupby + ([step.parentsColumn] if step.parentsColumn else []) + [step.labelsColumn]
    project_key = group_key + [step.milestonesColumn, step.valueColumn, "_id"]

    steps = _facet_keys_and_elements(step, group_key=group_key, project_key=project_key)
    if step.backfill:
        # Backfilling missing values
        steps += _backfill_missing_values(step, group_key=group_key, project_key=project_key)
    else:
        # Filtering out imcomplete elements (where either start or end is missing)
        steps += _filter_out_incomplete_elements(group_key=group_key, project_key=project_key)

    # Sorting both arrays on their group key to have them in the same order
    steps += _sort_elements(group_key=group_key, project_key=project_key)
    # Calculating the delta between the end and the start of the period for every element
    steps += _calculate_children_deltas(step)
    # Facetting children, parents, start and end value
    steps += _facet_results(step)
    # Unwinding everything
    steps += _unwind_results(step)

    unset: str | list[str] = _VQB_ORDER
    if len(step.groupby) == 0 and not step.parentsColumn:
        unset = [_VQB_ORDER, GROUP_WATERFALL_COLUMN]

    return steps + [
        {
            "$sort": {
                _VQB_ORDER: 1,
                ("LABEL_waterfall" if step.sortBy == "label" else step.valueColumn): 1 if step.order == "asc" else -1,
            },
        },
        {"$unset": unset},
    ]
