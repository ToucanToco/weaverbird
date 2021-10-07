import { shallowMount, Wrapper } from '@vue/test-utils';
import { DateTime } from 'luxon';

import CustomGranularityCalendar from '@/components/DatePicker/CustomGranularityCalendar.vue';
import { DateRange } from '@/lib/dates';

const currentYear = DateTime.now().year;

describe('CustomGranularityCalendar - Month', () => {
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
        expect(emittedDate.end?.toISOString()).toStrictEqual(`${currentYear}-03-01T00:00:00.000Z`);
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
