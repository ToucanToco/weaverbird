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
    integer: 'int',
    text: 'string',
  };
  const mongoType = typeMap[step.data_type] ?? '';
  for (const column of step.columns) {
    mongoAddFields[column] = { $convert: { input: $$(column), to: mongoType } };
  }
  return { $addFields: mongoAddFields };
}

/** transform a 'todate' step into corresponding mongo steps */
function transformToDate(step: Readonly<ToDateStep>): MongoStep[] {
  switch (step.format) {
    case undefined:
      // Mongo will try to guess the result
      return [
        { $addFields: { [step.column]: { $dateFromString: { dateString: $$(step.column) } } } },
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
    default:
      // Any other string
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
