"""
A very simple webserver to test and develop weaverbird python module.

The is only one route: `/`
GET: returns the available domains
POST: execute the pipeline in the body of the request and returns the transformed data

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`
"""
from glob import glob
from os.path import basename, splitext

import pandas as pd
from flask import Flask, Response, jsonify, request

from weaverbird.backends.pandas_executor.pipeline_executor import (
    preview_pipeline as pandas_preview_pipeline,
)
from weaverbird.pipeline import Pipeline

app = Flask(__name__)


# CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response


@app.route('/', methods=['GET', 'POST'])
def handle_request():
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


# Load all csv in playground's datastore
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
