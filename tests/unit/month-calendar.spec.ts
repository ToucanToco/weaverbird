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
  });

  describe('with initialDate', () => {
    beforeEach(() => {
      createWrapper({ initialDate: new Date('12/21/1977') });
    });

    it('should set header on corresponding year', () => {
      expect(wrapper.find('.month-calendar__header').text()).toBe('1977');
    });
  });
});
