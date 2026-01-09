// Placeholder for v-calendar
// In a real migration we would use react-day-picker.

import React from 'react';
import { DayPicker, DateRange as RDPDateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import classNames from 'classnames';

import { DateRange } from '@/lib/dates';
import { LocaleIdentifier } from '@/lib/internationalization';
import styles from './Calendar.module.scss';

export interface CalendarProps {
  value?: Date | DateRange;
  highlightedDates?: DateRange;
  availableDates?: DateRange;
  isRange?: boolean;
  locale?: LocaleIdentifier;
  className?: string;
  onInput?: (value: Date | DateRange | undefined) => void;
}

export default function Calendar({
  value,
  highlightedDates,
  availableDates,
  isRange = false,
  locale,
  className,
  onInput
}: CalendarProps) {

  const selected = value;

  const handleSelect = (val: any) => {
       if (onInput) onInput(val);
  };

  const disabledDays = [];
  if (availableDates) {
       if (availableDates.start) {
           disabledDays.push({ before: availableDates.start });
       }
       if (availableDates.end) {
           disabledDays.push({ after: availableDates.end });
       }
  }

  // Workaround for TypeScript error with React Day Picker union types
  const commonProps = {
      disabled: disabledDays,
      className: "weaverbird-day-picker",
      // locale: locale // Todo: map string to Locale object
  };

  // Convert custom DateRange to DayPicker DateRange (from/to)
  const toRDPDateRange = (dr: DateRange | undefined): RDPDateRange | undefined => {
      if (!dr) return undefined;
      return {
          from: dr.start,
          to: dr.end
      };
  };

  // Convert DayPicker range back to custom range (start/end)
  const handleRangeSelect = (range: RDPDateRange | undefined) => {
      if (onInput) {
          if (range) {
              onInput({ start: range.from, end: range.to, duration: 'day' });
          } else {
              onInput(undefined);
          }
      }
  };

  return (
    <div className={classNames(styles['vc-container'], className)} data-cy="weaverbird-calendar">
       {isRange ? (
           <DayPicker
                mode="range"
                selected={toRDPDateRange(selected as DateRange | undefined)}
                onSelect={handleRangeSelect}
                {...commonProps}
           />
       ) : (
           <DayPicker
                mode="single"
                selected={selected as Date | undefined}
                onSelect={handleSelect}
                {...commonProps}
           />
       )}
    </div>
  );
}
