import { shallowMount, Wrapper } from '@vue/test-utils';

import MonthCalendar from '@/components/DatePicker/MonthCalendar.vue';

describe('MonthCalendar', () => {
  let wrapper: Wrapper<MonthCalendar>;
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(MonthCalendar, {
      sync: false,
      propsData: {
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
      const months = wrapper.findAll('.month-calendar__option');
      expect(months).toHaveLength(12);
      expect(months.at(0).text()).toStrictEqual('January');
      expect(months.at(11).text()).toStrictEqual('December');
    });
  });

  describe('with initialDate', () => {
    beforeEach(() => {
      createWrapper({ initialDate: new Date('12/21/1977') });
    });

    it('should set header on corresponding year', () => {
      expect(wrapper.find('.month-calendar__header').text()).toBe('1977');
    });

    describe('when clicking on the previous year button', () => {
      beforeEach(async () => {
        await wrapper.find('.header-btn__previous').trigger('click');
      });

      it('should show the previous year', () => {
        expect(wrapper.find('.month-calendar__header').text()).toBe('1976');
      });
    });

    describe('when clicking on the next year button', () => {
      beforeEach(async () => {
        await wrapper.find('.header-btn__next').trigger('click');
      });

      it('should show the previous year', () => {
        expect(wrapper.find('.month-calendar__header').text()).toBe('1978');
      });
    });
  });
});
