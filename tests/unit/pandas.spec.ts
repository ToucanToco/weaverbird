import { Pipeline } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

describe('Pipeline to pandas translator', () => {
  const pandasTranslator = getTranslator('pandas');

  it('can generate rename steps', () => {
    const pipeline: Pipeline = [
      { name: 'rename', oldname: 'old-name', newname: 'new-name'},
      { name: 'rename', oldname: 'old-name2', newname: 'new-name2'},
    ];
    const querySteps = pandasTranslator.translate(pipeline).map(t => t.code);
    expect(querySteps.join('\n\n')).toEqual(`from datetime import datetime

import pandas as pd


def step_0000_rename(df):
    output_df = df.rename(columns={'old-name': 'new-name'})
    return output_df


def step_0001_rename(df):
    output_df = df.rename(columns={'old-name2': 'new-name2'})
    return output_df


def transform(df):
    df = step_0000_rename(df)
    df = step_0001_rename(df)
    return df
`)
  });
});
