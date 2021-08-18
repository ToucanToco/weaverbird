import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateRangeForm from '@/components/stepforms/widgets/DateComponents/RelativeDateRangeForm.vue';

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
    beforeEach(() => {
      createWrapper({});
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
  });
});
