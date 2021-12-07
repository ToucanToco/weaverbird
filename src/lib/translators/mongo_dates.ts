import { $$ } from '@/lib/helpers';
import * as S from '@/lib/steps';

export const DATE_EXTRACT_MAP: Record<S.BasicDatePart, string> = {
  year: '$year',
  month: '$month',
  day: '$dayOfMonth',
  week: '$week',
  dayOfYear: '$dayOfYear',
  dayOfWeek: '$dayOfWeek',
  isoYear: '$isoWeekYear',
  isoWeek: '$isoWeek',
  isoDayOfWeek: '$isoDayOfWeek',
  hour: '$hour',
  minutes: '$minute',
  seconds: '$second',
  milliseconds: '$millisecond',
};

export const ADVANCED_DATE_EXTRACT_MAP: Record<
  S.AdvancedDateInfo,
  (step: Readonly<S.DateExtractStep>) => object
> = {
  quarter: step => ({
    $switch: {
      branches: [
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 1] }, then: 1 },
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 2] }, then: 2 },
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 3] }, then: 3 },
      ],
      default: 4,
    },
  }),
  firstDayOfYear: step => ({
    $dateFromParts: { year: { $year: $$(step.column) }, month: 1, day: 1 },
  }),
  firstDayOfMonth: step => ({
    $dateFromParts: {
      year: { $year: $$(step.column) },
      month: { $month: $$(step.column) },
      day: 1,
    },
  }),
  firstDayOfWeek: step => ({
    // [ ] TO FIX using Mongo 5
    // We subtract to the target date a number of days corresponding to (dayOfWeek - 1)
    $subtract: [
      $$(step.column),
      {
        $multiply: [{ $subtract: [{ $dayOfWeek: $$(step.column) }, 1] }, 24 * 60 * 60 * 1000],
      },
    ],
  }),
  firstDayOfQuarter: step => ({
    $dateFromParts: {
      year: { $year: $$(step.column) },
      month: {
        $switch: {
          branches: [
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 1] }, then: 1 },
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 2] }, then: 4 },
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 3] }, then: 7 },
          ],
          default: 10,
        },
      },
      day: 1,
    },
  }),
  firstDayOfIsoWeek: step => ({
    // [ ] TO FIX using Mongo 5
    // We subtract to the target date a number of days corresponding to (isoDayOfWeek - 1)
    $subtract: [
      $$(step.column),
      {
        $multiply: [{ $subtract: [{ $isoDayOfWeek: $$(step.column) }, 1] }, 24 * 60 * 60 * 1000],
      },
    ],
  }),
  previousDay: step => ({
    // [ ] TO FIX using Mongo 5
    // We subtract to the target date 1 day in milliseconds
    $subtract: [$$(step.column), 24 * 60 * 60 * 1000],
  }),
  firstDayOfPreviousYear: step => ({
    $dateFromParts: {
      year: { $subtract: [{ $year: $$(step.column) }, 1] },
      month: 1,
      day: 1,
    },
  }),
  firstDayOfPreviousMonth: step => ({
    $dateFromParts: {
      year: {
        $cond: [
          { $eq: [{ $month: $$(step.column) }, 1] },
          { $subtract: [{ $year: $$(step.column) }, 1] },
          { $year: $$(step.column) },
        ],
      },
      month: {
        $cond: [
          { $eq: [{ $month: $$(step.column) }, 1] },
          12,
          { $subtract: [{ $month: $$(step.column) }, 1] },
        ],
      },
      day: 1,
    },
  }),
  firstDayOfPreviousWeek: step => ({
    // [ ] TO FIX using Mongo 5
    // We subtract to the target date a number of days corresponding to (dayOfWeek - 1)
    $subtract: [
      { $subtract: [$$(step.column), 7 * 24 * 60 * 60 * 1000] },
      {
        $multiply: [{ $subtract: [{ $dayOfWeek: $$(step.column) }, 1] }, 24 * 60 * 60 * 1000],
      },
    ],
  }),
  firstDayOfPreviousQuarter: step => ({
    $dateFromParts: {
      year: {
        $cond: [
          { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 1] },
          { $subtract: [{ $year: $$(step.column) }, 1] },
          { $year: $$(step.column) },
        ],
      },
      month: {
        $switch: {
          branches: [
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 1] }, then: 10 },
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 2] }, then: 1 },
            { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 3] }, then: 4 },
          ],
          default: 7,
        },
      },
      day: 1,
    },
  }),
  firstDayOfPreviousIsoWeek: step => ({
    // [ ] TO FIX using Mongo 5
    // We subtract to the target date a number of days corresponding to (isoDayOfWeek - 1)
    $subtract: [
      { $subtract: [$$(step.column), 7 * 24 * 60 * 60 * 1000] },
      {
        $multiply: [{ $subtract: [{ $isoDayOfWeek: $$(step.column) }, 1] }, 24 * 60 * 60 * 1000],
      },
    ],
  }),
  previousYear: step => ({
    $subtract: [{ $year: $$(step.column) }, 1],
  }),
  previousMonth: step => ({
    $cond: [
      { $eq: [{ $month: $$(step.column) }, 1] },
      12,
      { $subtract: [{ $month: $$(step.column) }, 1] },
    ],
  }),
  previousWeek: step => ({
    // We subtract to the target date 7 days in milliseconds
    $week: { $subtract: [$$(step.column), 7 * 24 * 60 * 60 * 1000] },
  }),
  previousQuarter: step => ({
    $switch: {
      branches: [
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 1] }, then: 4 },
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 2] }, then: 1 },
        { case: { $lte: [{ $divide: [{ $month: $$(step.column) }, 3] }, 3] }, then: 2 },
      ],
      default: 3,
    },
  }),
  previousIsoWeek: step => ({
    // We subtract to the target date 7 days in milliseconds
    $isoWeek: { $subtract: [$$(step.column), 7 * 24 * 60 * 60 * 1000] },
  }),
};
