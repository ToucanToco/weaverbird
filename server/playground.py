"""
A very simple webserver to test and develop weaverbird python module.

The is only one route: `/`
GET: returns the available domains
POST: execute the pipeline in the body of the request and returns the transformed data

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`
"""
import json
from glob import glob
from os.path import basename, splitext

import pandas as pd
from flask import Flask, Response, request

from weaverbird.pipeline_executor import PipelineExecutor

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
        return Response(json.dumps(get_available_domains()), mimetype='application/json')
    elif request.method == 'POST':
        return Response(
            execute_pipeline(request.get_json(), **request.args), mimetype='application/json'
        )


# Load all csv in playground's datastore
csv_files = glob('../playground/datastore/*.csv')
DOMAINS = {splitext(basename(csv_file))[0]: pd.read_csv(csv_file) for csv_file in csv_files}


def get_available_domains():
    return list(DOMAINS.keys())


def execute_pipeline(*args, **kwargs) -> str:
    executor = PipelineExecutor(lambda domain: DOMAINS[domain])

    # Url parameters are only strings, these two must be understood as numbers
    if 'limit' in kwargs:
        kwargs['limit'] = int(kwargs['limit'])
    if 'offset' in kwargs:
        kwargs['offset'] = int(kwargs['offset'])

    return executor.preview_pipeline(*args, **kwargs)
