import { shallowMount, Wrapper } from '@vue/test-utils';

import TabbedRangeCalendars from '@/components/stepforms/widgets/DateComponents/TabbedRangeCalendars.vue';

describe('TabbedRangeCalendars', () => {
  let wrapper: Wrapper<TabbedRangeCalendars>;
  const createWrapper = async (props: any = {}) => {
    wrapper = shallowMount(TabbedRangeCalendars, {
      sync: false,
      propsData: {
        ...props,
      },
    });
    await wrapper.vm.$nextTick();
  };

  beforeEach(async () => {
    await createWrapper();
  });

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should enable all tabs by default', () => {
    expect(wrapper.find('Tabs-stub').props('tabs')).toStrictEqual([
      'Days',
      'Months',
      'Quarters',
      'Years',
    ]);
  });

  it('should select the first tab by default', () => {
    expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('Days');
  });

  describe('with only some calendar enabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ enabledCalendars: ['Quarters', 'Years'] });
    });

    it('should only enable those calendar tabs', () => {
      expect(wrapper.find('Tabs-stub').props('tabs')).toStrictEqual(['Quarters', 'Years']);
    });

    it('should select the first tab by default', () => {
      expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('Quarters');
    });
  });

  describe('with only one calendar enabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ enabledCalendars: ['Years'] });
    });

    it('should not show tabs', () => {
      expect(wrapper.find('Tabs-stub').exists()).toBe(false);
    });

    it('should show the right calendar', () => {
      expect(wrapper.find('CustomGranularityCalendar-stub').isVisible()).toBe(true);
      expect(wrapper.find('CustomGranularityCalendar-stub').props('granularity')).toBe('year');
    });
  });
});
