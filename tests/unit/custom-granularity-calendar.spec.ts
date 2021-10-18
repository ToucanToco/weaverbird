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
      expect(wrapper.emitted('input')).toHaveLength(1);
      const emittedDate: DateRange = wrapper.emitted('input')[0][0];
      expect(emittedDate.start?.toISOString()).toStrictEqual(`2021-01-01T00:00:00.000Z`);
      expect(emittedDate.end?.toISOString()).toStrictEqual(`2021-03-31T23:59:59.999Z`);
      expect(emittedDate.duration).toBe('quarter');
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

    it('should convert an option to a date range', () => {
      const W48 = options[1];
      expect(RANGE_PICKERS.week.selectableRanges.optionToRange(W48)).toStrictEqual({
        start: new Date(Date.UTC(2016, 11, 2)),
        end: new Date(Date.UTC(2016, 11, 8, 23, 59, 59, 999)),
        duration: 'week',
      });
    });

    it('should provide the right description', () => {
      const W48 = options[1];
      const range = RANGE_PICKERS.week.selectableRanges.optionToRange(W48);
      expect(RANGE_PICKERS.week.selectableRanges.description(range)).toBe('12/2/2016 - 12/8/2016');
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.week.selectableRanges.rangeToOption(new Date(Date.UTC(2016, 3, 12))),
      ).toStrictEqual(DateTime.utc(2016, 4, 12, { locale: 'en' }));
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
});
