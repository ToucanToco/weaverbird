import { Pipeline } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

describe('Mongo translator support tests', () => {
  const mongo40translator = getTranslator('mongo40');

  it('should support any kind of operation', () => {
    expect(mongo40translator.unsupportedSteps).toEqual([]);
  });
});

describe('Pipeline to mongo translator', () => {
  const mongo40translator = getTranslator('mongo40');

  it('can generate a convert step', () => {
    const pipeline: Pipeline = [
      {
        name: 'convert',
        columns: ['foo', 'bar'],
        data_type: 'boolean',
      },
      {
        name: 'convert',
        columns: ['date'],
        data_type: 'date',
      },
      {
        name: 'convert',
        columns: ['float'],
        data_type: 'float',
      },
      {
        name: 'convert',
        columns: ['int'],
        data_type: 'integer',
      },
      {
        name: 'convert',
        columns: ['text'],
        data_type: 'text',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      {
        $addFields: {
          foo: { $convert: { input: '$foo', to: 'bool' } },
          bar: { $convert: { input: '$bar', to: 'bool' } },
          date: { $convert: { input: '$date', to: 'date' } },
          float: { $convert: { input: '$float', to: 'double' } },
          int: { $convert: { input: '$int', to: 'int' } },
          text: { $convert: { input: '$text', to: 'string' } },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a todate step without specified format ("guess")', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $dateFromString: { dateString: '$foo' } } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a todate step with a custom format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%Y-%m-%d',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { foo: { $dateFromString: { dateString: '$foo', format: '%Y-%m-%d' } } } },
      { $project: { _id: 0 } },
    ]);
  });

  it('can generate a todate step with "%Y-%m" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%Y-%m',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempDate: { $concat: ['$foo', '-01'] } } },
      {
        $addFields: {
          foo: { $dateFromString: { dateString: '$_vqbTempDate', format: '%Y-%m-%d' } },
        },
      },
      { $project: { _id: 0, _vqbTempDate: 0 } },
    ]);
  });
});
