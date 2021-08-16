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
      expect(wrapper.exists()).toBeTruthy();
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
