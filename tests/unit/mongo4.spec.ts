import { Pipeline } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

const monthReplace = {
  $switch: {
    branches: [
      {
        case: { $in: ['$_vqbTempMonth', ['jan', 'jan.', 'january', 'janv', 'janv.', 'janvier']] },
        then: '01',
      },
      {
        case: {
          $in: [
            '$_vqbTempMonth',
            ['feb', 'feb.', 'february', 'fév', 'fev', 'févr.', 'fevr.', 'février'],
          ],
        },
        then: '02',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['mar', 'mar.', 'march', 'mars']] },
        then: '03',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['apr', 'apr.', 'april', 'avr', 'avr.', 'avril']] },
        then: '04',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['may', 'mai']] },
        then: '05',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['june', 'jun.', 'june', 'juin']] },
        then: '06',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['jul', 'jul.', 'july', 'juil', 'juil.', 'juillet']] },
        then: '07',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['aug', 'aug.', 'august', 'août', 'aout']] },
        then: '08',
      },
      {
        case: {
          $in: ['$_vqbTempMonth', ['sep', 'sep.', 'september', 'sept', 'sept.', 'septembre']],
        },
        then: '09',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['oct', 'oct.', 'october', 'octobre']] },
        then: '10',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['nov', 'nov.', 'november', 'novembre']] },
        then: '11',
      },
      {
        case: { $in: ['$_vqbTempMonth', ['dec', 'dec.', 'december', 'déc', 'déc.', 'décembre']] },
        then: '12',
      },
    ],
  },
};

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
        },
      },
      {
        $addFields: {
          date: { $convert: { input: '$date', to: 'date' } },
        },
      },
      {
        $addFields: {
          float: { $convert: { input: '$float', to: 'double' } },
        },
      },
      {
        $addFields: {
          int: { $convert: { input: '$int', to: 'int' } },
        },
      },
      {
        $addFields: {
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

  it('can generate a todate step with "%d %b %Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%d %b %Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', ' '] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 1] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a todate step with "%d-%b-%Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%d-%b-%Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 1] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a todate step with "%d %B %Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%d %B %Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', ' '] } } },
      {
        $addFields: {
          _vqbTempDay: { $arrayElemAt: ['$_vqbTempArray', 0] },
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 1] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 2] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a todate step with "%b %Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%b %Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', ' '] } } },
      {
        $addFields: {
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 0] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a todate step with "%b-%Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%b-%Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', '-'] } } },
      {
        $addFields: {
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 0] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
    ]);
  });

  it('can generate a todate step with "%B %Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%B %Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempArray: { $split: ['$foo', ' '] } } },
      {
        $addFields: {
          _vqbTempMonth: { $toLower: { $arrayElemAt: ['$_vqbTempArray', 0] } },
          _vqbTempYear: { $arrayElemAt: ['$_vqbTempArray', 1] },
        },
      },
      {
        $addFields: { _vqbTempMonth: monthReplace },
      },
      {
        $addFields: {
          foo: {
            $dateFromString: {
              dateString: {
                $concat: ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
              },
              format: '%d-%m-%Y',
            },
          },
        },
      },
      { $project: { _id: 0, _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
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

  it('can generate a todate step with "%Y %m" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%Y/%m',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempDate: { $concat: ['$foo', '/01'] } } },
      {
        $addFields: {
          foo: { $dateFromString: { dateString: '$_vqbTempDate', format: '%Y/%m/%d' } },
        },
      },
      { $project: { _id: 0, _vqbTempDate: 0 } },
    ]);
  });

  it('can generate a todate step with "%m-%Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%m-%Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempDate: { $concat: ['01-', '$foo'] } } },
      {
        $addFields: {
          foo: { $dateFromString: { dateString: '$_vqbTempDate', format: '%d-%m-%Y' } },
        },
      },
      { $project: { _id: 0, _vqbTempDate: 0 } },
    ]);
  });

  it('can generate a todate step with "%m/%Y" format', () => {
    const pipeline: Pipeline = [
      {
        name: 'todate',
        column: 'foo',
        format: '%m/%Y',
      },
    ];
    const querySteps = mongo40translator.translate(pipeline);
    expect(querySteps).toEqual([
      { $addFields: { _vqbTempDate: { $concat: ['01/', '$foo'] } } },
      {
        $addFields: {
          foo: { $dateFromString: { dateString: '$_vqbTempDate', format: '%d/%m/%Y' } },
        },
      },
      { $project: { _id: 0, _vqbTempDate: 0 } },
    ]);
  });
});
