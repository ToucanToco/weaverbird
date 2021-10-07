import { shallowMount, Wrapper } from '@vue/test-utils';
import { DateTime } from 'luxon';

import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import { DECADE_NAV, RANGE_PICKERS } from '@/components/DatePicker/GranularityConfigs';
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
        expect(months.at(0).text()).toStrictEqual('January');
        expect(months.at(11).text()).toStrictEqual('December');
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
            `${currentYear}-03-01T00:00:00.000Z`,
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

  describe('Quarter options', () => {
    const options = RANGE_PICKERS.quarter.selectableRanges.currentOptions(SAMPLE_DATE_TIME);

    it('should provide the right label', () => {
      expect(RANGE_PICKERS.quarter.selectableRanges.label(SAMPLE_DATE_TIME)).toBe('Quarter 4');
    });

    it('should provide the right options', () => {
      expect(options).toHaveLength(4);
      expect(options.map(dt => dt.quarter)).toStrictEqual([1, 2, 3, 4]);
    });

    it('should convert an option to a date range', () => {
      const Q2 = options[1];
      expect(RANGE_PICKERS.quarter.selectableRanges.optionToRange(Q2)).toStrictEqual({
        start: new Date(Date.UTC(2016, 3, 1)),
        end: new Date(Date.UTC(2016, 6, 1)),
        duration: 'quarter',
      });
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.quarter.selectableRanges.rangeToOption({
          // Weird quarter from the 12th to the 12th
          start: new Date(Date.UTC(2016, 3, 12)),
          end: new Date(Date.UTC(2016, 6, 12)),
          duration: 'quarter',
        }),
      ).toStrictEqual(DateTime.utc(2016, 4, 1, { locale: 'en' }));
    });
  });

  describe('Year options', () => {
    const options = RANGE_PICKERS.year.selectableRanges.currentOptions(SAMPLE_DATE_TIME);

    it('should provide the right label', () => {
      expect(RANGE_PICKERS.year.selectableRanges.label(SAMPLE_DATE_TIME)).toBe('2016');
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
        end: new Date(Date.UTC(2013, 0, 1)),
        duration: 'year',
      });
    });

    it('should convert a arbitrary date range to the associated option', () => {
      expect(
        RANGE_PICKERS.year.selectableRanges.rangeToOption({
          // Weird year from the 12th feb to the 12th feb
          start: new Date(Date.UTC(2012, 1, 12)),
          end: new Date(Date.UTC(2013, 1, 12)),
          duration: 'year',
        }),
      ).toStrictEqual(DateTime.utc(2012, 1, 1, { locale: 'en' }));
    });
  });
});
