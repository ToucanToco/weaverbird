import { shallowMount, Wrapper } from '@vue/test-utils';

import RangeCalendar from '@/components/DatePicker/RangeCalendar.vue';

jest.mock('@/components/DatePicker/Calendar.vue');

describe('RangeCalendar', () => {
  let wrapper: Wrapper<RangeCalendar>;
  const value = { start: new Date(), end: new Date(1) };
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(RangeCalendar, {
      sync: false,
      propsData: {
        value,
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
    it('should instantiate 2 Calendar components', () => {
      expect(wrapper.findAll('Calendar-stub')).toHaveLength(2);
    });
    it('should pass correct values to Calendar components', () => {
      const calendars = wrapper.findAll('Calendar-stub');
      expect(calendars.at(0).props().value).toStrictEqual(value.start);
      expect(calendars.at(1).props().value).toStrictEqual(value.end);
    });
    it('should pass correct available dates to Calendar components', () => {
      const calendars = wrapper.findAll('Calendar-stub');
      expect(calendars.at(0).props().availableDates).toStrictEqual({ ...value, start: undefined }); // value can't be greater than end
      expect(calendars.at(1).props().availableDates).toStrictEqual({ ...value, end: undefined }); // value can't be lower than start
    });
    it('should emit modified start range when first Calendar is updated', () => {
      const date = new Date(1);
      const calendars = wrapper.findAll('Calendar-stub');
      calendars.at(0).vm.$emit('input', date);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({ ...value, start: date });
    });
    it('should emit modified end range when last Calendar is updated', () => {
      const date = new Date(2);
      const calendars = wrapper.findAll('Calendar-stub');
      calendars.at(1).vm.$emit('input', date);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({ ...value, end: date });
    });
    it('should remove property if Calendar updated value is undefined', () => {
      const date = undefined;
      const calendars = wrapper.findAll('Calendar-stub');
      calendars.at(1).vm.$emit('input', date);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({ start: value.start });
    });
    it('should pass range included dates to highlight in Calendar', () => {
      const calendar = wrapper.find('Calendar-stub');
      expect(calendar.props().highlightedDates).toStrictEqual(value);
    });
  });

  describe('when range is not complete', () => {
    beforeEach(() => {
      createWrapper({ value: { start: new Date() } });
    });
    it('should not pass range included dates to highlight in Calendar', () => {
      const calendar = wrapper.find('Calendar-stub');
      expect(calendar.props().highlightedDates).toStrictEqual(undefined);
    });
  });

  describe('when range is undefined', () => {
    beforeEach(() => {
      createWrapper({ value: undefined });
    });
    it('should set value to {} by default', () => {
      expect((wrapper.vm as any).value).toStrictEqual({});
    });
  });
});
