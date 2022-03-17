from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ToDateStep


def translate_todate(step: ToDateStep) -> List[MongoStep]:
    date_format = step.format

    col_as_string = {'$toString': f'${step.column}'}

    if date_format:
        # % B and %b should be equivalent
        date_format = date_format.replace('%B', '%b')

    if not date_format:
        # Mongo will try to guess the date format
        return [
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {
                            'dateString': col_as_string,
                            # However, we give it a second chance to find formats it can't guess natively
                            'onError': {
                                '$cond': [
                                    # Integer values may be either years or timestamps
                                    {'$eq': [{'$type': f'${step.column}'}, 'int']},
                                    {
                                        '$cond': [
                                            # We decide that values lower than 10_000 will be interpreted as years...
                                            {'$lt': [f'${step.column}', 10_000]},
                                            {
                                                '$dateFromString': {
                                                    'dateString': {
                                                        '$concat': [col_as_string, '-01-01']
                                                    },
                                                    'format': '%Y-%m-%d',
                                                }
                                            },
                                            # ...and greater values will be interpreted as timestamps
                                            {
                                                '$convert': {
                                                    'input': f'${step.column}',
                                                    'to': 'date',
                                                    'onError': {'$literal': None},
                                                }
                                            },
                                        ]
                                    },
                                    # otherwise, we have no idea what date it corresponds to
                                    {'$literal': None},
                                ]
                            },
                        }
                    }
                }
            }
        ]

    # Mongo doesn't handle months names (%b and %B), so we replace them by numbers before converting
    # All these could probably be factorized to make it easier to read!
    elif date_format == '%d %b %Y':
        return [
            {'$addFields': {'_vqbTempArray': {'$split': [col_as_string, ' ']}}},
            {
                '$addFields': {
                    '_vqbTempDay': {'$arrayElemAt': ['$_vqbTempArray', 0]},
                    '_vqbTempMonth': {'$toLower': {'$arrayElemAt': ['$_vqbTempArray', 1]}},
                    '_vqbTempYear': {'$arrayElemAt': ['$_vqbTempArray', 2]},
                },
            },
            {
                '$addFields': {'_vqbTempMonth': MONTH_REPLACEMENT_STEP},
            },
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {
                            'dateString': {
                                '$concat': [
                                    '$_vqbTempDay',
                                    '-',
                                    '$_vqbTempMonth',
                                    '-',
                                    '$_vqbTempYear',
                                ],
                            },
                            'format': '%d-%m-%Y',
                        },
                    },
                },
            },
            {
                '$project': {
                    '_vqbTempArray': 0,
                    '_vqbTempDay': 0,
                    '_vqbTempMonth': 0,
                    '_vqbTempYear': 0,
                }
            },
        ]

    elif date_format == '%d-%b-%Y':
        return [
            {'$addFields': {'_vqbTempArray': {'$split': [col_as_string, '-']}}},
            {
                '$addFields': {
                    '_vqbTempDay': {'$arrayElemAt': ['$_vqbTempArray', 0]},
                    '_vqbTempMonth': {'$toLower': {'$arrayElemAt': ['$_vqbTempArray', 1]}},
                    '_vqbTempYear': {'$arrayElemAt': ['$_vqbTempArray', 2]},
                },
            },
            {
                '$addFields': {'_vqbTempMonth': MONTH_REPLACEMENT_STEP},
            },
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {
                            'dateString': {
                                '$concat': [
                                    '$_vqbTempDay',
                                    '-',
                                    '$_vqbTempMonth',
                                    '-',
                                    '$_vqbTempYear',
                                ],
                            },
                            'format': '%d-%m-%Y',
                        },
                    },
                },
            },
            {
                '$project': {
                    '_vqbTempArray': 0,
                    '_vqbTempDay': 0,
                    '_vqbTempMonth': 0,
                    '_vqbTempYear': 0,
                }
            },
        ]

    elif date_format == '%b %Y':
        return [
            {'$addFields': {'_vqbTempArray': {'$split': [col_as_string, ' ']}}},
            {
                '$addFields': {
                    '_vqbTempMonth': {'$toLower': {'$arrayElemAt': ['$_vqbTempArray', 0]}},
                    '_vqbTempYear': {'$arrayElemAt': ['$_vqbTempArray', 1]},
                },
            },
            {
                '$addFields': {'_vqbTempMonth': MONTH_REPLACEMENT_STEP},
            },
            {
                '$addFields': {
                    [step.column]: {
                        '$dateFromString': {
                            'dateString': {
                                '$concat': ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear']
                            },
                            'format': '%d-%m-%Y',
                        },
                    },
                },
            },
            {'$project': {'_vqbTempArray': 0, '_vqbTempMonth': 0, '_vqbTempYear': 0}},
        ]

    elif date_format == '%b-%Y':
        return [
            {'$addFields': {'_vqbTempArray': {'$split': [col_as_string, '-']}}},
            {
                '$addFields': {
                    '_vqbTempMonth': {'$toLower': {'$arrayElemAt': ['$_vqbTempArray', 0]}},
                    '_vqbTempYear': {'$arrayElemAt': ['$_vqbTempArray', 1]},
                },
            },
            {
                '$addFields': {'_vqbTempMonth': MONTH_REPLACEMENT_STEP},
            },
            {
                '$addFields': {
                    [step.column]: {
                        '$dateFromString': {
                            'dateString': {
                                '$concat': ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear']
                            },
                            'format': '%d-%m-%Y',
                        },
                    },
                },
            },
            {'$project': {'_vqbTempArray': 0, '_vqbTempMonth': 0, '_vqbTempYear': 0}},
        ]

    # Mongo does not support dates where some parts of the date are missing
    elif date_format == '%Y-%m':
        return [
            {'$addFields': {'_vqbTempDate': {'$concat': [col_as_string, '-01']}}},
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {'dateString': '$_vqbTempDate', 'format': '%Y-%m-%d'}
                    },
                },
            },
            {'$project': {'_vqbTempDate': 0}},
        ]

    elif date_format == '%Y/%m':
        return [
            {'$addFields': {'_vqbTempDate': {'$concat': [col_as_string, '/01']}}},
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {'dateString': '$_vqbTempDate', 'format': '%Y/%m/%d'}
                    },
                },
            },
            {'$project': {'_vqbTempDate': 0}},
        ]

    elif date_format == '%m-%Y':
        return [
            {'$addFields': {'_vqbTempDate': {'$concat': ['01-', col_as_string]}}},
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {'dateString': '$_vqbTempDate', 'format': '%d-%m-%Y'}
                    },
                },
            },
            {'$project': {'_vqbTempDate': 0}},
        ]

    elif date_format == '%m/%Y':
        return [
            {'$addFields': {'_vqbTempDate': {'$concat': ['01/', col_as_string]}}},
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {'dateString': '$_vqbTempDate', 'format': '%d/%m/%Y'}
                    },
                },
            },
            {'$project': {'_vqbTempDate': 0}},
        ]

    elif date_format == '%Y':
        return [
            {'$addFields': {'_vqbTempDate': {'$concat': [col_as_string, '-01-01']}}},
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {'dateString': '$_vqbTempDate', 'format': '%Y-%m-%d'}
                    },
                },
            },
            {'$project': {'_vqbTempDate': 0}},
        ]

    else:
        return [
            {
                '$addFields': {
                    step.column: {
                        '$dateFromString': {
                            'dateString': col_as_string,
                            'format': date_format,
                            'onError': {'$literal': None},
                        }
                    }
                }
            }
        ]


MONTH_NUMBER_TO_NAMES = {
    '01': ['jan', 'jan.', 'january', 'janv', 'janv.', 'janvier'],
    '02': ['feb', 'feb.', 'february', 'fév', 'fev', 'févr.', 'fevr.', 'février'],
    '03': ['mar', 'mar.', 'march', 'mars'],
    '04': ['apr', 'apr.', 'april', 'avr', 'avr.', 'avril'],
    '05': ['may', 'mai'],
    '06': ['june', 'jun.', 'june', 'juin'],
    '07': ['jul', 'jul.', 'july', 'juil', 'juil.', 'juillet'],
    '08': ['aug', 'aug.', 'august', 'août', 'aout'],
    '09': ['sep', 'sep.', 'september', 'sept', 'sept.', 'septembre'],
    '10': ['oct', 'oct.', 'october', 'octobre'],
    '11': ['nov', 'nov.', 'november', 'novembre'],
    '12': ['dec', 'dec.', 'december', 'déc', 'déc.', 'décembre'],
}

MONTH_REPLACEMENT_STEP = {
    '$switch': {
        'branches': [
            {
                'case': {'$in': month_names},
                'then': month_number,
            }
            for month_number, month_names in MONTH_NUMBER_TO_NAMES.items()
        ]
    }
}
