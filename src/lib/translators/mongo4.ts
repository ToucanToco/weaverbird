/** This module contains mongo specific translation operations */

import { $$ } from '@/lib/helpers';
import { ConvertStep, ToDateStep } from '@/lib/steps';
import { Mongo36Translator } from '@/lib/translators/mongo';

type PropMap<T> = { [prop: string]: T };

/**
 * MongoStep interface. For now, it's basically an object with any property.
 */
export interface MongoStep {
  [propName: string]: any;
}

/** transform a 'convert' step into corresponding mongo steps */
function transformConvert(step: Readonly<ConvertStep>): MongoStep {
  const mongoAddFields: PropMap<any> = {};
  const typeMap = {
    boolean: 'bool',
    date: 'date',
    float: 'double',
    integer: 'long', // better to cast into 64-bit integers. 32-bit integers ('int') cannot be casted to dates
    text: 'string',
  };
  const mongoType = typeMap[step.data_type] ?? '';
  for (const column of step.columns) {
    // mongo cannot cast integers into date but only long into date, so we
    // manage the cast from int to long when nedded
    const input =
      mongoType === 'date'
        ? { $cond: [{ $eq: [{ $type: $$(column) }, 'int'] }, { $toLong: $$(column) }, $$(column)] }
        : $$(column);
    mongoAddFields[column] = { $convert: { input, to: mongoType } };
  }
  return { $addFields: mongoAddFields };
}

/** transform a 'todate' step into corresponding mongo steps */
function transformToDate(step: Readonly<ToDateStep>): MongoStep[] {
  let format = step.format;
  if (format !== undefined) {
    // %B and %b are treated the same
    format = format.replace('%B', '%b');
  }

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

  switch (format) {
    case undefined:
      // Mongo will try to guess the result
      return [
        { $addFields: { [step.column]: { $dateFromString: { dateString: $$(step.column) } } } },
      ];
    case '%d %b %Y':
      return [
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), ' '] } } },
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
            [step.column]: {
              $dateFromString: {
                dateString: {
                  $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
                },
                format: '%d-%m-%Y',
              },
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%d-%b-%Y':
      return [
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
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
            [step.column]: {
              $dateFromString: {
                dateString: {
                  $concat: ['$_vqbTempDay', '-', '$_vqbTempMonth', '-', '$_vqbTempYear'],
                },
                format: '%d-%m-%Y',
              },
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempDay: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%b %Y':
      return [
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), ' '] } } },
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
            [step.column]: {
              $dateFromString: {
                dateString: { $concat: ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear'] },
                format: '%d-%m-%Y',
              },
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%b-%Y':
      return [
        { $addFields: { _vqbTempArray: { $split: [$$(step.column), '-'] } } },
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
            [step.column]: {
              $dateFromString: {
                dateString: { $concat: ['01-', '$_vqbTempMonth', '-', '$_vqbTempYear'] },
                format: '%d-%m-%Y',
              },
            },
          },
        },
        { $project: { _vqbTempArray: 0, _vqbTempMonth: 0, _vqbTempYear: 0 } },
      ];
    case '%Y-%m':
      // Mongo does not support "incomplete" date string where the day is missing
      // so we add the first day of the month and use the format %Y-%m-%d instead
      return [
        { $addFields: { _vqbTempDate: { $concat: [$$(step.column), '-01'] } } },
        {
          $addFields: {
            [step.column]: { $dateFromString: { dateString: '$_vqbTempDate', format: '%Y-%m-%d' } },
          },
        },
        { $project: { _vqbTempDate: 0 } },
      ];
    case '%Y/%m':
      // Mongo does not support "incomplete" date string where the day is missing
      // so we add the first day of the month and use the format %Y/%m/%d instead
      return [
        { $addFields: { _vqbTempDate: { $concat: [$$(step.column), '/01'] } } },
        {
          $addFields: {
            [step.column]: { $dateFromString: { dateString: '$_vqbTempDate', format: '%Y/%m/%d' } },
          },
        },
        { $project: { _vqbTempDate: 0 } },
      ];
    case '%m-%Y':
      // Mongo does not support "incomplete" date string where the day is missing
      // so we add the first day of the month and use the format %d-%m-%Y instead
      return [
        { $addFields: { _vqbTempDate: { $concat: ['01-', $$(step.column)] } } },
        {
          $addFields: {
            [step.column]: { $dateFromString: { dateString: '$_vqbTempDate', format: '%d-%m-%Y' } },
          },
        },
        { $project: { _vqbTempDate: 0 } },
      ];
    case '%m/%Y':
      // Mongo does not support "incomplete" date string where the day is missing
      // so we add the first day of the month and use the format %d/%m/%Y instead
      return [
        { $addFields: { _vqbTempDate: { $concat: ['01/', $$(step.column)] } } },
        {
          $addFields: {
            [step.column]: { $dateFromString: { dateString: '$_vqbTempDate', format: '%d/%m/%Y' } },
          },
        },
        { $project: { _vqbTempDate: 0 } },
      ];
    case '%Y':
      // Mongo does not support "incomplete" date string where the day or month is missing
      // so we add the first day of the month and of the first month of the year and use the format %d/%m/%Y
      // WARNING: this format cannot be guessed by mongo himself
      return [
        { $addFields: { _vqbTempDate: { $concat: ['01/01/', $$(step.column)] } } },
        {
          $addFields: {
            [step.column]: { $dateFromString: { dateString: '$_vqbTempDate', format: '%d/%m/%Y' } },
          },
        },
        { $project: { _vqbTempDate: 0 } },
      ];
    default:
      return [
        {
          $addFields: {
            [step.column]: {
              $dateFromString: { dateString: $$(step.column), format: step.format },
            },
          },
        },
      ];
  }
}

export class Mongo40Translator extends Mongo36Translator {
  static label = 'Mongo 4.0';
}
Object.assign(Mongo40Translator.prototype, { convert: transformConvert, todate: transformToDate });
