import { shallowMount, Wrapper } from '@vue/test-utils';

import TabbedRangeCalendars from '@/components/stepforms/widgets/DateComponents/TabbedRangeCalendars.vue';

jest.mock('@/components/DatePicker/Calendar.vue');

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
      'year',
      'quarter',
      'month',
      'week',
      'day',
    ]);
  });

  it('should provide a methode to translate tabs', async () => {
    await wrapper.setProps({
      locale: 'fr',
    });
    expect(wrapper.find('Tabs-stub').props('formatTab')('day')).toBe('Jour');
  });

  it('should select the first tab by default', () => {
    expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('year');
  });

  describe('when updating enabled calendars', () => {
    beforeEach(async () => {
      await wrapper.setProps({ enabledCalendars: ['quarter', 'day'] });
    });

    it('should only enable those calendar tabs', () => {
      expect(wrapper.find('Tabs-stub').props('tabs')).toStrictEqual(['quarter', 'day']);
    });

    it('should select the first tab available when previous selected tab is missing', () => {
      expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('quarter');
    });
  });

  describe('with only one calendar enabled', () => {
    beforeEach(async () => {
      await wrapper.setProps({ enabledCalendars: ['year'] });
    });

    it('should not show tabs', () => {
      expect(wrapper.find('Tabs-stub').exists()).toBe(false);
    });

    it('should show the right calendar', () => {
      expect(wrapper.find('CustomGranularityCalendar-stub').isVisible()).toBe(true);
      expect(wrapper.find('CustomGranularityCalendar-stub').props('granularity')).toBe('year');
    });
  });

  describe('with selected value', () => {
    describe('on create', () => {
      describe('with a day range', () => {
        beforeEach(async () => {
          await createWrapper({
            value: {
              start: new Date('2021-11-01T00:00:00'),
              end: new Date('2022-12-18T00:00:00'),
              duration: 'day',
            },
          });
        });

        it('should select the day Calendar', () => {
          expect(wrapper.find('Calendar-stub').isVisible()).toBe(true);
        });
      });
    });
    describe('on update', () => {
      describe('with known granularity', () => {
        beforeEach(async () => {
          createWrapper();
          await wrapper.setProps({
            value: {
              start: new Date(Date.UTC(2012, 0, 1)),
              end: new Date(Date.UTC(2012, 11, 31, 23, 59, 59, 999)),
              duration: 'year',
            },
          });
        });

        it('should select the appropriate tab', () => {
          expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('year');
        });
      });

      describe('with unknown granularity', () => {
        beforeEach(async () => {
          createWrapper();
          await wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'day');
          await wrapper.setProps({
            value: {
              start: new Date(Date.UTC(2012, 0, 1)),
              end: new Date(Date.UTC(2012, 11, 31, 23, 59, 59, 999)),
            },
          });
        });

        it('should stay on the already selected tab', () => {
          expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('day');
        });
      });
    });
  });

  describe('with updated enabled calendars', () => {
    beforeEach(async () => {
      await wrapper.setProps({
        value: {
          start: new Date(Date.UTC(2012, 0, 1)),
          end: new Date(Date.UTC(2012, 11, 31, 23, 59, 59, 999)),
          duration: 'year',
        },
      });
    });
    it('should keep on current tab with value still in enabled calendars', async () => {
      await wrapper.setProps({ enabledCalendars: ['year', 'month'] });
      expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('year');
    });

    it('should fallback to first tab with value not in enabled calendars', async () => {
      await wrapper.setProps({ enabledCalendars: ['day', 'month'] });
      expect(wrapper.find('Tabs-stub').props('selectedTab')).toBe('day');
    });
  });
});
