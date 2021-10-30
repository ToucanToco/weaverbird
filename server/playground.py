"""
A very simple webserver to test and develop weaverbird.

Routes:
- `/`: serves the playground static files
- `/pandas`: pandas backend
    - GET: returns the available domains
    - POST: execute the pipeline in the body of the request and returns the transformed data
- `/mongo`: not implemented yet
- `/snowflake`: not implemented yet
- `/health`: simple health check

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`
"""
from glob import glob
from os.path import basename, splitext

import pandas as pd
from flask import Flask, Response, jsonify, request, send_from_directory

from weaverbird.backends.pandas_executor.pipeline_executor import (
    preview_pipeline as pandas_preview_pipeline,
)
from weaverbird.pipeline import Pipeline

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def handle_health_request():
    return 'OK'


@app.route('/pandas', methods=['GET', 'POST'])
def handle_pandas_backend_request():
    if request.method == 'GET':
        return jsonify(get_available_domains())
    elif request.method == 'POST':
        try:
            return Response(
                execute_pipeline(request.get_json(), **request.args), mimetype='application/json'
            )
        except Exception as e:
            errmsg = f'{e.__class__.__name__}: {e}'
            return jsonify(errmsg), 400


@app.route('/', methods=['GET'])
@app.route('/<path:filename>', methods=['GET'])
def handle_static_files_request(filename=None):
    filename = filename or 'index.html'
    return send_from_directory('static', filename)


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
