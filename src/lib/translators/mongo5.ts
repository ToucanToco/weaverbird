import { RelativeDate } from '@/lib/dates';

import { Mongo42Translator } from './mongo42';

export class Mongo50Translator extends Mongo42Translator {
  static label = 'Mongo 5.0';

  protected translateRelativeDate(value: RelativeDate): object {
    return {
      $dateAdd: {
        startDate: {
          // Base date does not include any hour information
          $dateTrunc: {
            date: '$$NOW',
            unit: 'day',
          },
        },
        amount: value.quantity,
        unit: value.duration,
      },
    };
  }
}
