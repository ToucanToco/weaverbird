import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateRangeForm from '@/components/stepforms/widgets/DateComponents/RelativeDateRangeForm.vue';

const SAMPLE_VARIABLES = [
  { label: 'Today', identifier: 'today' },
  { label: 'Tomorrow', identifier: 'tomorrow' },
  { label: 'Next month', identifier: 'newt_month' },
];

describe('Relative date range form', () => {
  let wrapper: Wrapper<RelativeDateRangeForm>;
  const createWrapper = (propsData: any = {}) => {
    wrapper = shallowMount(RelativeDateRangeForm, {
      sync: false,
      propsData,
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    const date = 'today';
    beforeEach(() => {
      createWrapper({
        value: [date, { date, quantity: 1, duration: 'month' }],
        availableVariables: SAMPLE_VARIABLES,
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should use an autocomplete input for from part', () => {
      expect(wrapper.find('AutocompleteWidget-stub').exists()).toBe(true);
    });
    it('should use a RelativeDateForm for to part', () => {
      expect(wrapper.find('RelativeDateForm-stub').exists()).toBe(true);
    });
    it('should pass option refering to date value to autocomplete input', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toStrictEqual({
        identifier: 'today',
        label: 'Today',
      });
    });
    it('should pass relative date part of value to relative date form input', () => {
      expect(wrapper.find('RelativeDateForm-stub').props().value).toStrictEqual({
        date,
        quantity: 1,
        duration: 'month',
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should initiate value', () => {
      expect((wrapper.vm as any).value).toStrictEqual([
        undefined,
        { date: undefined, quantity: -1, duration: 'year' },
      ]);
    });
    it('should set available variables to empty array', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().options).toStrictEqual([]);
    });
  });
});
