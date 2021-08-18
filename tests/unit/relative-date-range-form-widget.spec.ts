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
  });
});
