import { shallowMount, Wrapper } from '@vue/test-utils';

import CustomVariableList from '@/components/stepforms/widgets/DateComponents/CustomVariableList.vue';

describe('Custom variable list', () => {
  let wrapper: Wrapper<CustomVariableList>;

  beforeEach(() => {
    wrapper = shallowMount(CustomVariableList, {
      sync: false,
      propsData: {
        availableVariables: [
          {
            category: 'App variables',
            label: 'view',
            identifier: 'appRequesters.view',
            value: 'Product 123',
          },
          {
            category: 'App variables',
            label: 'date.month',
            identifier: 'appRequesters.date.month',
            value: 'Apr',
          },
          {
            category: 'App variables',
            label: 'date.year',
            identifier: 'appRequesters.date.year',
            value: '2020',
          },
          {
            category: 'App variables',
            label: 'date.today',
            identifier: 'appRequesters.date.today',
            value: new Date(1623398957013),
          },
          {
            category: 'Story variables',
            label: 'country',
            identifier: 'requestersManager.country',
            value: '2020',
          },
          {
            category: 'Story variables',
            label: 'city',
            identifier: 'appRequesters.city',
            value: 'New York',
          },
        ],
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should instantiate a variable list', () => {
    expect(wrapper.find('VariableList-stub').exists()).toBeTruthy();
  });

  it('should display an "Custom" option ...', () => {
    expect(wrapper.find('.widget-custom-variable-list__custom-option').exists()).toBe(true);
  });

  describe('when choosing "Custom"', () => {
    beforeEach(async () => {
      wrapper.find('.widget-custom-variable-list__custom-option').vm.$emit('input');
      await wrapper.vm.$nextTick();
    });

    it('should emit selectCustomVariable', () => {
      expect(wrapper.emitted('selectCustomVariable')).toHaveLength(1);
    });
  });

  describe('when choosing a variable', () => {
    beforeEach(async () => {
      wrapper.find('VariableList-stub').vm.$emit('input', 'appRequesters.view');
      await wrapper.vm.$nextTick();
    });

    it('should emit a new value with the chosen variable', () => {
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0]).toEqual(['appRequesters.view']);
    });
  });
});

describe('Custom variable list - empty', () => {
  let wrapper: Wrapper<CustomVariableList>;
  beforeEach(() => {
    wrapper = shallowMount(CustomVariableList, {
      sync: false,
      propsData: {},
    });
  });
  afterEach(() => {
    wrapper.destroy();
  });
  it('should set availableVariables to empty array', () => {
    expect((wrapper.vm as any).availableVariables).toStrictEqual([]);
  });
});
