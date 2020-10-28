"""
A very simple webserver to test and develop weaverbird python module.

The is only one route: `/`
GET: returns the available domains
POST: execute the pipeline in the body of the request and returns the transformed data

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`
"""
import json
from typing import List

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
        return json.dumps(get_available_domains())
    elif request.method == 'POST':
        return execute_pipeline(request.get_json(), **request.args)


# Load domains in memory
DOMAINS = {'sales': pd.read_csv('../playground/datastore/sales.csv')}


def get_available_domains():
    return list(DOMAINS.keys())


def execute_pipeline(*args, **kwargs) -> dict:
    executor = PipelineExecutor(lambda domain: DOMAINS[domain])
    return executor.preview_pipeline(*args, **kwargs)
