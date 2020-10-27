"""
A very simple webserver to test and develop weaverbird python module.

The is only one route: `/`
GET: returns the available domains
POST: execute the pipeline in the body of the request and returns the transformed data

Run it with `FLASK_APP=playground FLASK_ENV=development flask run`
"""
import json

import pandas as pd
from flask import Flask, Response, request

from weaverbird.pipeline_executor import PipelineExecutor

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'GET':
        return json.dumps(get_available_domains())
    elif request.method == 'POST':
        return execute_pipeline(request.get_json())


# Load domains in memory
DOMAINS = {'sales': pd.read_csv('../playground/datastore/sales.csv')}


def get_available_domains():
    return list(DOMAINS.keys())


def execute_pipeline(pipeline):
    executor = PipelineExecutor(lambda domain: DOMAINS[domain])
    df = executor.execute_pipeline(pipeline)
    return Response(df.to_json(orient='table'), mimetype='application/json')
