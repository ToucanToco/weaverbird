/** This module contains mongo specific translation operations */

import { $$ } from '@/lib/helpers';
import { ConvertStep } from '@/lib/steps';
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

export class Mongo40Translator extends Mongo36Translator {
  static label = 'Mongo 4.0';
}
Object.assign(Mongo40Translator.prototype, { convert: transformConvert });
