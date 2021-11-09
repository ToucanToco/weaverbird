"""
A very simple webserver to test and develop weaverbird.

Routes:
- `/`: serves the playground static files
- `/pandas`: pandas backend
    - GET: returns the available domains
    - POST: execute the pipeline in the body of the request and returns the transformed data
- `/mongo`:
    - GET: return the available collections in the database
    - POSt: execute the aggregation pipeline and return a page of it (limit, offset) along with total count and types
- `/snowflake`: not implemented yet
- `/health`: simple health check

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`

Environment variables:
- for mongo, MONGODB_CONNECTION_STRING (default to localhost:27017) and MONGODB_DATABASE_NAME (default to 'data')
"""
import os
from glob import glob
from os.path import basename, splitext

import pandas as pd
from pymongo import MongoClient
from quart import Quart, Response, jsonify, request, send_from_directory

from weaverbird.backends.pandas_executor.pipeline_executor import (
    preview_pipeline as pandas_preview_pipeline,
)
from weaverbird.pipeline import Pipeline

app = Quart(__name__)


@app.route('/health', methods=['GET'])
def handle_health_request():
    return 'OK'


### Pandas back-end routes

# Load all csv in playground's pandas datastore
csv_files = glob('../playground/datastore/*.csv')
DOMAINS = {splitext(basename(csv_file))[0]: pd.read_csv(csv_file) for csv_file in csv_files}


def get_available_domains():
    return list(DOMAINS.keys())


def execute_pipeline(pipeline_steps, **kwargs) -> str:
    # Validation
    pipeline = Pipeline(steps=pipeline_steps)

    # Url parameters are only strings, these two must be understood as numbers
    if 'limit' in kwargs:
        kwargs['limit'] = int(kwargs['limit'])
    if 'offset' in kwargs:
        kwargs['offset'] = int(kwargs['offset'])

    return pandas_preview_pipeline(
        pipeline=pipeline,
        domain_retriever=lambda domain: DOMAINS[domain],
        **kwargs,
    )


@app.route('/pandas', methods=['GET', 'POST'])
async def handle_pandas_backend_request():
    if request.method == 'GET':
        return jsonify(get_available_domains())

    elif request.method == 'POST':
        try:
            return Response(
                execute_pipeline(await request.get_json(), **request.args),
                mimetype='application/json',
            )
        except Exception as e:
            errmsg = f'{e.__class__.__name__}: {e}'
            return jsonify(errmsg), 400


### Mongo back-end routes
mongo_client = MongoClient(os.getenv('MONGODB_CONNECTION_STRING'))
mongo_db = mongo_client[os.getenv('MONGODB_DATABASE_NAME', default='data')]


def facetize_mongo_aggregation(query, limit, offset):
    """
    Transform an aggregation query into a `$facet` one so that we can get in a single
     query both total query count (independently of `$limit` or `$skip` operators) and
    the query results.
    """
    if not len(query):
        query = [{'$match': {}}]

    new_query = [
        *query,
        {
            '$facet': {
                'state_total_count': [
                    {
                        '$group': {
                            '_id': None,
                            'count': {
                                '$sum': 1,
                            },
                        },
                    },
                ],
                'stage_results': [
                    {
                        '$skip': offset,
                    },
                    {
                        '$limit': limit,
                    },
                    {'$project': {'_id': 0}},
                ],
                'stage_types': [
                    {
                        '$skip': offset,
                    },
                    {
                        '$limit': limit,
                    },
                    {'$group': {'_id': None, '_vqbAppArray': {'$push': '$$ROOT'}}},
                    {'$unwind': {'path': "$_vqbAppArray", 'includeArrayIndex': "_vqbAppIndex"}},
                    {
                        '$project': {
                            '_vqbAppArray': {
                                '$objectToArray': '$_vqbAppArray',
                            },
                            '_vqbAppIndex': 1,
                        },
                    },
                    {
                        '$unwind': '$_vqbAppArray',
                    },
                    {
                        '$project': {
                            'column': '$_vqbAppArray.k',
                            'type': {
                                '$type': '$_vqbAppArray.v',
                            },
                            '_vqbAppIndex': 1,
                        },
                    },
                    {
                        '$group': {
                            '_id': '$_vqbAppIndex',
                            '_vqbAppArray': {
                                '$addToSet': {
                                    'column': '$column',
                                    'type': '$type',
                                },
                            },
                        },
                    },
                    {
                        '$project': {
                            '_vqbAppTmpObj': {
                                '$arrayToObject': {
                                    '$zip': {
                                        'inputs': ['$_vqbAppArray.column', '$_vqbAppArray.type'],
                                    },
                                },
                            },
                        },
                    },
                    {
                        '$replaceRoot': {
                            'newRoot': '$_vqbAppTmpObj',
                        },
                    },
                ],
            },
        },
        {
            '$unwind': '$state_total_count',
        },
        {
            '$project': {
                'count': '$state_total_count.count',
                'data': '$stage_results',
                'types': '$stage_types',
            },
        },
    ]

    return new_query


@app.route('/mongo', methods=['GET', 'POST'])
async def handle_mongo_backend_request():
    if request.method == 'GET':
        return jsonify(mongo_db.list_collection_names())

    elif request.method == 'POST':
        try:
            req_params = await request.get_json()

            query = req_params['query']
            collection = req_params['collection']
            limit = req_params['limit']
            offset = req_params['offset']

            facetized_query = facetize_mongo_aggregation(query, limit, offset)
            results = list(mongo_db[collection].aggregate(facetized_query))
            # ObjectID are not JSON serializable, so remove them
            for row in results:
                if '_id' in row:
                    del row['_id']
            return jsonify(results)
        except Exception as e:
            errmsg = f'{e.__class__.__name__}: {e}'
            return jsonify(errmsg), 400


### UI files


@app.route('/', methods=['GET'])
@app.route('/<path:filename>', methods=['GET'])
async def handle_static_files_request(filename=None):
    filename = filename or 'index.html'
    return await send_from_directory('static', filename)
