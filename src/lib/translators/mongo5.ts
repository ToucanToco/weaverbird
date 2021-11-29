import { RelativeDateRange } from '@/lib/dates';

import { Mongo42Translator } from './mongo42';

export class Mongo50Translator extends Mongo42Translator {
  static label = 'Mongo 5.0';

  protected translateRelativeDate(value: RelativeDateRange): object {
    return {
      $dateAdd: {
        startDate: {
          // Base date does not include any hour information
          $dateTrunc: {
            date: '$$NOW', // TODO: adapt date with selected variable
            unit: 'day',
          },
        },
        amount: value.quantity,
        unit: value.duration,
      },
    };
  }
}
