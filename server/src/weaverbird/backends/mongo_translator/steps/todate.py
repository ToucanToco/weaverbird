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
