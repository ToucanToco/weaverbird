import { shallowMount, Wrapper } from '@vue/test-utils';

import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';

describe('Date input', () => {
  let wrapper: Wrapper<NewDateInput>;
  const createWrapper = (propsData = {}) => {
    wrapper = shallowMount(NewDateInput, {
      sync: false,
      propsData,
    });
  };

  describe('default', () => {
    beforeEach(() => {
      createWrapper();
    });

    it('should instantiate', () => {
      expect(wrapper.exists()).toBeTruthy();
    });
  });
});