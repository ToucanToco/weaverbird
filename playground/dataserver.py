from glob import glob
import json
import mimetypes
import os.path as osp

from flask import Flask, abort, jsonify, request

import pipelib as P

HERE = osp.dirname(osp.abspath(__file__))
DIST_DIRPATH = osp.join(HERE, 'dist')
app = Flask(__name__)

DTYPE_TO_XSD = {
    'int8': 'short',
    'int16': 'short',
    'int32': 'int',
    'int64': 'long',
    'uint8': 'short',
    'uint16': 'short',
    'uint32': 'int',
    'uint64': 'long',
    'float16': 'float',
    'float32': 'float',
    'float64': 'float',
    'float128': 'float',
    'bool': 'boolean',
    'datetime64': 'dateTime',
    'datetime64[ns]': 'dateTime',
    'timedelta64': 'duration',
    'timedelta64[ns]': 'duration',
    'str': 'string',
    'character': 'string',
}


def df_xsd_types(df):
    """return a mapping `colname` → `xsd-type`"""
    xsd_types = {}
    for colname, dtype in df.dtypes.items():
        # pandas will expose "object" instead of "string" so try to guess if
        # it's a string by introspecting the first value
        if dtype.name == 'object' and not df.empty and isinstance(df[colname].iloc[0], str):
            xsd_type = 'string'
        else:
            xsd_type = DTYPE_TO_XSD.get(dtype.name, 'unknown')
        xsd_types[colname] = xsd_type
    return xsd_types


def df_to_json(df):
    return json.loads(df.to_json(orient='records', date_format='iso', default_handler=repr))


def execute_pipeline(pipeline):
    domain_step = pipeline[0]
    domain_step['domain'] = osp.join(HERE, 'datastore', domain_step['domain'])
    df = P.domain(domain_step)
    for step in pipeline[1:]:
        df = getattr(P, step['name'])(df, step)
    return df


@app.route('/collections')
def collections():
    return jsonify([osp.basename(filepath) for filepath in glob(osp.join(HERE, 'datastore', '*.csv'))])


@app.route('/query', methods=['POST'])
def query():
    pipeline = request.json
    df = execute_pipeline(pipeline)
    return jsonify([{
        'data': df_to_json(df),
        'count': len(df),
        'types': [df_xsd_types(df) if not df.empty else {}],
    }])


@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def catch_all(path):
    filepath = osp.join(DIST_DIRPATH, path)
    if osp.isfile(filepath):
      with open(filepath, 'rb') as f:
          return f.read(), 200, {'Content-type': mimetypes.guess_type(filepath)}
    return abort(404)
