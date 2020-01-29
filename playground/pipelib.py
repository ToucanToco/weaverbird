import pandas as pd

def domain(step):
    return pd.read_csv(step['domain'])


def rename(df, step):
    return df.rename(columns={step['oldname']: step['newname']})


def fillna(df, step):
    return df.fillna(value={step['column']: step['value']})


def filter(df, step):
    filter_infos = step['condition']['and'][0]
    operator = filter_infos['operator']
    if operator == 'eq':
        operator = '=='
    elif operator == 'ne':
        operator = '!='
    elif operator == 'gt':
        operator == '>'
    elif operator == 'ge':
        operator == '>='
    elif operator == 'lt':
        operator == '<'
    elif operator == 'le':
        operator == '<='
    expr = f'{filter_infos["column"]} {operator} {repr(filter_infos["value"])}'
    return df.query(expr)


#####
# import pipelib
# df.pipe(pipelib.rename, steps[0]).pipe(pipelib.fillna, steps[1])
