import { shallowMount, Wrapper } from '@vue/test-utils';
import { DateTime } from 'luxon';

import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import { DECADE_NAV, RANGE_PICKERS, WEEK_NAV } from '@/components/DatePicker/GranularityConfigs';
import { DateRange } from '@/lib/dates';

const currentYear = DateTime.now().year;
const SAMPLE_DATE_TIME = DateTime.fromRFC2822('25 Nov 2016 13:23 Z', { locale: 'en' });

describe('CustomGranularityCalendar', () => {
  let wrapper: Wrapper<CustomGranularityCalendar>;
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(CustomGranularityCalendar, {
      sync: false,
      propsData: {
        granularity: 'month',
        ...props,
      },
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  // Test the "month" config with the component itself
  describe('Month', () => {
    describe('default', () => {
      beforeEach(() => {
        createWrapper();
      });

      it('should instantiate', () => {
        expect(wrapper.exists()).toBe(true);
      });

      it('should display all 12 months', () => {
        const months = wrapper.findAll('.custom-granularity-calendar__option');
        expect(months).toHaveLength(12);
      });

      it('should display labels', () => {
        const labels = wrapper.findAll('.custom-granularity-calendar__option-label');
        expect(labels).toHaveLength(12);
        expect(labels.at(0).text()).toStrictEqual('January');
        expect(labels.at(11).text()).toStrictEqual('December');
      });

      it('should hide descriptions', () => {
        const descriptions = wrapper.findAll('.custom-granularity-calendar__option-description');
        expect(descriptions).toHaveLength(0);
      });

      describe('when clicking on a a month', () => {
        beforeEach(async () => {
          const february = wrapper.findAll('.custom-granularity-calendar__option').at(1);
          await february.trigger('click');
        });

        it('should emit the selected date range', () => {
          expect(wrapper.emitted('input')).toHaveLength(1);
          const emittedDate: DateRange = wrapper.emitted('input')[0][0];
          expect(emittedDate.start).toBeInstanceOf(Date);
          expect(emittedDate.end).toBeInstanceOf(Date);
          expect(emittedDate.start?.toISOString()).toStrictEqual(
            `${currentYear}-02-01T00:00:00.000Z`,
          );
          expect(emittedDate.end?.toISOString()).toStrictEqual(
            `${currentYear}-02-28T23:59:59.999Z`,
          );
          expect(emittedDate.duration).toBe('month');
        });
      });
    });

    describe('with selected date range', () => {
      beforeEach(() => {
        createWrapper({
          value: {
            start: new Date('12/21/1977'),
            // only based on start date (for now)
          },
        });
      });

      it('should set header on corresponding year', () => {
        expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('1977');
      });

      it('should select the corresponding month', () => {
        expect(wrapper.find('.custom-granularity-calendar__option--selected').text()).toBe(
          'December',
        );
      });

      describe('when clicking on the previous year button', () => {
        beforeEach(async () => {
          await wrapper.find('.header-btn__previous').trigger('click');
        });

        it('should show the previous year', () => {
          expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('1976');
        });
      });

      describe('when clicking on the next year button', () => {
        beforeEach(async () => {
          await wrapper.find('.header-btn__next').trigger('click');
        });

        it('should show the previous year', () => {
          expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('1978');
        });
      });
    });
  });

  describe('with bounds', () => {
    const bounds = {
      start: new Date('11/15/2021'),
      end: new Date('12/15/2021'),
    };

    beforeEach(() => {
      createWrapper({
        granularity: 'month',
        bounds,
      });
    });
    it('should set header on year corresponding to start bound', () => {
      expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('2021');
    });
  });

  describe('with range out of bounds', () => {
    const bounds = {
      start: new Date('11/15/2021'),
      end: new Date('12/15/2021'),
    };

    beforeEach(() => {
      createWrapper({
        granularity: 'month',
        value: {
          start: new Date('10/15/2021'),
          end: new Date('12/15/2021'),
          duration: 'month',
        },
        bounds,
      });
    });

    it('should use clamped range instead of raw value', () => {
      expect(wrapper.find('.custom-granularity-calendar__option--selected').text()).toBe(
        'November',
      );
    });

    it('should set header on year corresponding to clamped range', () => {
      expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('2021');
    });

    it('should emit corresponding clamped range', () => {
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({
        start: new Date('2021-11-01T00:00:00.000Z'),
        end: new Date('2021-11-30T23:59:59.999Z'),
        duration: 'month',
      });
    });
  });

  describe('when bounds are updated and value become completely out of bounds', () => {
    beforeEach(async () => {
      createWrapper({
        granularity: 'month',
        value: {
          start: new Date('10/15/2021'),
          end: new Date('12/15/2021'),
          duration: 'month',
        },
        bounds: {
          start: new Date('11/15/2021'),
          end: new Date('12/15/2021'),
        },
      });
      await wrapper.setProps({
        bounds: {
          start: new Date('09/15/2020'),
          end: new Date('10/15/2020'),
        },
      });
    });
    it('should set header on year corresponding to updated start bound', () => {
      expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('2020');
    });
    it('should reset value', () => {
      expect(wrapper.emitted('input')).toHaveLength(2);
      expect(wrapper.emitted('input')[1][0]).toBeUndefined();
    });
  });

  describe('When switching granularity with a selected date range', () => {
    beforeEach(async () => {
      createWrapper({
        granularity: 'month',
        value: {
          start: new Date('02/01/2021'),
        },
      });
      await wrapper.setProps({ granularity: 'quarter' });
    });

    it('should emit an updated selected date range', () => {
      expect(wrapper.emitted('input')).toHaveLength(2);
      const emittedDate: DateRange = wrapper.emitted('input')[1][0];
      expect(emittedDate.start?.toISOString()).toStrictEqual(`2021-01-01T00:00:00.000Z`);
      expect(emittedDate.end?.toISOString()).toStrictEqual(`2021-03-31T23:59:59.999Z`);
      expect(emittedDate.duration).toBe('quarter');
    });

    it('should set header on year corresponding to selected date range', () => {
      expect(wrapper.find('.custom-granularity-calendar__header').text()).toBe('2021');
    });
  });

  // For everything else, only test date related fonction aka the "Granularity Config"
  describe('Decade navigation', () => {
    it('should provide the right label', () => {
      expect(DECADE_NAV.label(SAMPLE_DATE_TIME)).toBe('2010-2020');
    });

    it('should provide a date in the next decade', () => {
      expect(DECADE_NAV.next(SAMPLE_DATE_TIME).year).toBe(2026);
    });

    it('should provide a date in the previous decade', () => {
      expect(DECADE_NAV.prev(SAMPLE_DATE_TIME).year).toBe(2006);
    });
  });

  describe('Week navigation', () => {
    it('should provide the right label', () => {
      expect(WEEK_NAV.label(SAMPLE_DATE_TIME)).toBe('W47 - W2 2017');
    });

    it('should provide a date in the next week', () => {
      expect(WEEK_NAV.next(SAMPLE_DATE_TIME).weekNumber).toBe(3);
    });

    it('should provide a date in the previous week', () => {
      expect(WEEK_NAV.prev(SAMPLE_DATE_TIME).weekNumber).toBe(39);
    });
  });

  describe('Week options', () => {
    const options = RANGE_PICKERS.week.selectableRanges.currentOptions(SAMPLE_DATE_TIME);

    it('should provide the right label', () => {
      expect(RANGE_PICKERS.week.selectableRanges.label(SAMPLE_DATE_TIME)).toBe('Week 47');
    });

    it('should provide the right options', () => {
      expect(options).toHaveLength(8);
      expect(options.map(dt => dt.weekNumber)).toStrictEqual([47, 48, 49, 50, 51, 52, 1, 2]);
    });

    it('should convert an option to a date range (monday to monday)', () => {
      const W48 = options[1];
      expect(RANGE_PICKERS.week.selectableRanges.optionToRange(W48)).toStrictEqual({
        start: new Date('2016-11-28T00:00:00.000Z'), // monday November 28th 2016
        end: new Date('2016-12-04T23:59:59.999Z'), // sunday December 4th 2016
        duration: 'week',
      });
    });

    it('should provide the right description', () => {
      const W48 = options[1];
      const range = RANGE_PICKERS.week.selectableRanges.optionToRange(W48);
      expect(RANGE_PICKERS.week.selectableRanges.description(range)).toBe('11/28/2016 - 12/4/2016');
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.week.selectableRanges.rangeToOption(new Date('2016-04-12T00:00:00.000Z')), // a tuesda3
      ).toStrictEqual(DateTime.utc(2016, 4, 11, { locale: 'en' }));
    });
  });

  describe('Quarter options', () => {
    const options = RANGE_PICKERS.quarter.selectableRanges.currentOptions(SAMPLE_DATE_TIME);

    it('should provide the right label', () => {
      expect(RANGE_PICKERS.quarter.selectableRanges.label(SAMPLE_DATE_TIME)).toBe('Quarter 4');
    });

    it('should provide the right description', () => {
      const Q2 = options[1];
      const range = RANGE_PICKERS.quarter.selectableRanges.optionToRange(Q2);
      expect(RANGE_PICKERS.quarter.selectableRanges.description(range)).toBe('');
    });

    it('should provide the right options', () => {
      expect(options).toHaveLength(4);
      expect(options.map(dt => dt.quarter)).toStrictEqual([1, 2, 3, 4]);
    });

    it('should convert an option to a date range', () => {
      const Q2 = options[1];
      expect(RANGE_PICKERS.quarter.selectableRanges.optionToRange(Q2)).toStrictEqual({
        start: new Date(Date.UTC(2016, 3, 1)),
        end: new Date(Date.UTC(2016, 5, 30, 23, 59, 59, 999)),
        duration: 'quarter',
      });
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.quarter.selectableRanges.rangeToOption(
          // Weird quarter from the 12th to the 12th
          new Date(Date.UTC(2016, 3, 12)),
        ),
      ).toStrictEqual(DateTime.utc(2016, 4, 1, { locale: 'en' }));
    });
  });

  describe('Year options', () => {
    const options = RANGE_PICKERS.year.selectableRanges.currentOptions(SAMPLE_DATE_TIME);

    it('should provide the right label', () => {
      expect(RANGE_PICKERS.year.selectableRanges.label(SAMPLE_DATE_TIME)).toBe('2016');
    });

    it('should provide the right description', () => {
      const Year2012 = options[2];
      const range = RANGE_PICKERS.year.selectableRanges.optionToRange(Year2012);
      expect(RANGE_PICKERS.year.selectableRanges.description(range)).toBe('');
    });

    it('should provide the right options', () => {
      expect(options).toHaveLength(11);
      expect(options.map(dt => dt.year)).toStrictEqual([
        2010,
        2011,
        2012,
        2013,
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
        2020,
      ]);
    });

    it('should convert an option to a date range', () => {
      const Year2012 = options[2];
      expect(RANGE_PICKERS.year.selectableRanges.optionToRange(Year2012)).toStrictEqual({
        start: new Date(Date.UTC(2012, 0, 1)),
        end: new Date(Date.UTC(2012, 11, 31, 23, 59, 59, 999)),
        duration: 'year',
      });
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.year.selectableRanges.rangeToOption(
          // Weird year from the 12th feb to the 12th feb
          new Date(Date.UTC(2012, 1, 12)),
        ),
      ).toStrictEqual(DateTime.utc(2012, 1, 1, { locale: 'en' }));
    });
  });

  describe('bounds', () => {
    beforeEach(() => {
      createWrapper({
        granularity: 'month',
        value: new Date('2021-10-19'), // in october 2021
        bounds: {
          start: new Date('2021-05-15'), // middle of may 2021
          end: new Date('2021-11-31'), // end of november 2021
        },
      });
    });

    it('should deactivate choices that have no overlap with the bounds range', async () => {
      const options = wrapper.findAll('.custom-granularity-calendar__option');
      const enabledOptionsLabels = options
        .filter(w => !w.classes('custom-granularity-calendar__option--disabled'))
        .wrappers.map(w => w.find('.custom-granularity-calendar__option-label').text());
      const disabledOptionsLabels = options
        .filter(w => w.classes('custom-granularity-calendar__option--disabled'))
        .wrappers.map(w => w.find('.custom-granularity-calendar__option-label').text());

      expect(enabledOptionsLabels).toEqual([
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
      ]);
      expect(disabledOptionsLabels).toEqual(['January', 'February', 'March', 'April', 'December']);

      // Clicking on a disabled button should have no effect
      await options.filter(w => w.text().includes('January')).wrappers[0].trigger('click');
      expect(wrapper.emitted('input')).toBeUndefined();
    });

    it('should deactivate navigation towards NavRanges that would be all disabled', async () => {
      // NOTE: to avoid being blocked in a sate when a user can't escape (with a start value out-of-bounds),
      // the navigation buttons are only visually disabled, but remains clickable.

      expect(wrapper.find('.header-btn__previous').classes()).toContain(
        'custom-granularity-calendar__header-btn--disabled',
      );
      expect(wrapper.find('.header-btn__next').classes()).toContain(
        'custom-granularity-calendar__header-btn--disabled',
      );

      // No bounds, every navigation should be possible
      await wrapper.setProps({
        bounds: {},
      });
      expect(wrapper.find('.header-btn__previous').classes()).not.toContain(
        'custom-granularity-calendar__header-btn--disabled',
      );
      expect(wrapper.find('.header-btn__next').classes()).not.toContain(
        'custom-granularity-calendar__header-btn--disabled',
      );
    });
  });
});
