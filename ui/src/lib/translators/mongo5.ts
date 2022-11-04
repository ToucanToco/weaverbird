import { RELATIVE_DATE_OPERATORS } from '@/lib/dates';
import type {  RelativeDate } from '@/lib/dates';
import { $$ } from '@/lib/helpers';
import type * as S from '@/lib/steps';
import {
  ADVANCED_DATE_EXTRACT_MAP_MONGO_5,
  transformDateExtractFactory,
  truncateDateToDay,
} from '@/lib/translators/mongo-dates';

import type { MongoStep } from './mongo4';
import { Mongo42Translator } from './mongo42';

export class Mongo50Translator extends Mongo42Translator {
  static label = 'Mongo 5.0';

  protected translateRelativeDate(value: RelativeDate): object {
    const operator = RELATIVE_DATE_OPERATORS[value.operator];
    return {
      $dateAdd: {
        startDate: {
          // Base date does not include any hour information
          $dateTrunc: {
            date: value.date,
            unit: 'day',
          },
        },
        // if relative date has a "before" operator we expect to have a negative quantity
        amount: Math.sign(operator.sign) * Math.abs(value.quantity),
        unit: value.duration,
      },
    };
  }

  truncateDateToDay(dateExpr: string | object): string | object {
    return truncateDateToDay(dateExpr);
  }
}

function transformDateExtract(step: Readonly<S.DateExtractStep>): object {
  return transformDateExtractFactory(ADVANCED_DATE_EXTRACT_MAP_MONGO_5)(step);
}

/** transforms a 'replacetext' step into corresponding mongo steps. $replaceAll was only added in  */
/** mongo 4.4 */
function transformReplaceText(step: Readonly<S.ReplaceTextStep>): MongoStep {
  return {
    $set: {
      [step.searchColumn]: {
        $replaceAll: {
          input: $$(step.searchColumn),
          find: step.oldStr,
          replacement: step.newStr,
        },
      },
    },
  };
}

Object.assign(Mongo50Translator.prototype, {
  dateextract: transformDateExtract,
  replacetext: transformReplaceText,
});
