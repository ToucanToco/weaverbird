import { shallowMount, Wrapper } from '@vue/test-utils';

import TabbedRangeCalendars from '@/components/stepforms/widgets/DateComponents/TabbedRangeCalendars.vue';

describe('TabbedRangeCalendars', () => {
  let wrapper: Wrapper<TabbedRangeCalendars>;
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(TabbedRangeCalendars, {
      sync: false,
      propsData: {
        ...props,
      },
    });
  };

  beforeEach(() => {
    createWrapper();
  });

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBe(true);
  });
});
