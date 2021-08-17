import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateForm from '@/components/stepforms/widgets/DateComponents/RelativeDateForm.vue';

describe('Relative date form', () => {
  let wrapper: Wrapper<RelativeDateForm>;
  const VARIABLES = [
    {
      label: 'Today',
      identifier: 'today',
    },
    {
      label: 'Last month',
      identifier: 'last_month',
    },
    {
      label: 'This year',
      identifier: 'this_year',
    },
  ];
  const createWrapper = (propsData: any = {}) => {
    wrapper = shallowMount(RelativeDateForm, {
      sync: false,
      propsData,
    });
  };

  afterEach(() => {
    wrapper.destroy();
  });

  describe('default', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: VARIABLES,
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should use a number input', () => {
      expect(wrapper.find('InputNumberWidget-stub').exists()).toBe(true);
    });
    it('should use an autcomplete input', () => {
      expect(wrapper.find('AutocompleteWidget-stub').exists()).toBe(true);
    });
    it('should pass durations options labels to autcomplete', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().options).toStrictEqual([
        'Today',
        'Last month',
        'This year',
      ]);
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should set availableVariables to empty array', () => {
      expect((wrapper.vm as any).availableVariables).toStrictEqual([]);
    });
  });
});
