import { shallowMount, Wrapper } from '@vue/test-utils';

import Calendar from '@/components/Calendar.vue';

describe('Calendar', () => {
  let wrapper: Wrapper<Calendar>;
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(Calendar, {
      sync: false,
      propsData: {
        value: undefined,
        isRange: false,
        ...props,
      },
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    const defaultValue = new Date();
    beforeEach(() => {
      createWrapper({ value: defaultValue });
    });

    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should instantiate a DatePicker', () => {
      expect(wrapper.find('DatePicker-stub').exists()).toBe(true);
    });
    it('should pass value to DatePicker', () => {
      expect(wrapper.find('DatePicker-stub').props().value).toStrictEqual(defaultValue);
    });
    it('should emit new value when datepicker is updated', () => {
      const value = new Date(1);
      wrapper.find('DatePicker-stub').vm.$emit('input', value);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual(value);
    });
    it('should not display highlighted dates', () => {
      const attributes = (wrapper.vm as any).highlights;
      expect(attributes).toHaveLength(0);
    });
  });

  describe('is range', () => {
    const defaultValue = { start: new Date(), end: new Date(1) };
    beforeEach(() => {
      createWrapper({
        value: defaultValue,
        isRange: true,
      });
    });
    it('should active DatePicker as range', () => {
      expect(wrapper.find('DatePicker-stub').props().isRange).toBe(true);
    });
    it('should pass value to DatePicker', () => {
      expect(wrapper.find('DatePicker-stub').props().value).toStrictEqual(defaultValue);
    });
    it('should emit new value when datepicker is updated', () => {
      const value = { start: new Date(), end: new Date(2) };
      wrapper.find('DatePicker-stub').vm.$emit('input', value);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual(value);
    });
  });

  describe('with highlighted dates', () => {
    const highlightedDates = [new Date(1), new Date(2)];
    beforeEach(() => {
      createWrapper({
        value: new Date(),
        highlightedDates,
      });
    });
    it('should display highlighted dates', () => {
      const attributes = (wrapper.vm as any).highlights;
      expect(attributes).toHaveLength(1);
      expect(attributes[0].key).toBe('highlighted');
      expect(attributes[0].dates).toStrictEqual(highlightedDates);
    });
  });
});
