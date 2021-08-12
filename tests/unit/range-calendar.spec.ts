import { shallowMount, Wrapper } from '@vue/test-utils';

import RangeCalendar from '@/components/RangeCalendar.vue';

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

  beforeEach(() => {
    createWrapper();
  });

  afterEach(() => {
    wrapper.destroy();
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
});
