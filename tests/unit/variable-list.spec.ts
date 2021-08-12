import { shallowMount, Wrapper } from '@vue/test-utils';

import VariableList from '@/components/stepforms/widgets/VariableInputs/VariableList.vue';

describe('Variable List', () => {
  let wrapper: Wrapper<VariableList>;
  const VARIABLES = [
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
  ];
  const createWrapper = (propsData: any = {}) => {
    wrapper = shallowMount(VariableList, {
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
        selectedVariables: 'appRequesters.city',
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBeTruthy();
    });

    it('should present all available variables organized in sections', () => {
      const sections = wrapper.findAll('.widget-variable-list__section');
      expect(sections).toHaveLength(2);
      expect(
        sections
          .at(0)
          .find('.widget-variable-list__section-title')
          .text(),
      ).toEqual('App variables');
      expect(
        sections
          .at(1)
          .find('.widget-variable-list__section-title')
          .text(),
      ).toEqual('Story variables');
      const varsFromFirstSection = sections.at(0).findAll('VariableListOption-stub');
      expect(varsFromFirstSection).toHaveLength(4);
    });

    it('should pass right data to option', () => {
      const option = wrapper.find('VariableListOption-stub');
      expect(option.props()).toStrictEqual({
        label: 'view',
        identifier: 'appRequesters.view',
        value: 'Product 123',
        togglable: false,
        selectedVariables: 'appRequesters.city',
      });
    });

    describe('when choosing a variable', () => {
      beforeEach(async () => {
        wrapper.find('VariableListOption-stub').vm.$emit('input', 'appRequesters.view');
        await wrapper.vm.$nextTick();
      });

      it('should emit a new value with the chosen variable', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0]).toEqual(['appRequesters.view']);
      });
    });
  });

  describe('multiple mode', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: VARIABLES,
        isMultiple: true,
        selectedVariables: ['appRequesters.date.month', 'appRequesters.date.year'],
      });
    });

    it('should pass right data to option', () => {
      const option = wrapper.find('VariableListOption-stub');
      expect(option.props()).toStrictEqual({
        label: 'view',
        identifier: 'appRequesters.view',
        value: 'Product 123',
        togglable: true,
        selectedVariables: ['appRequesters.date.month', 'appRequesters.date.year'],
      });
    });

    describe('when choosing a variable', () => {
      it('should add the value to the list ...', async () => {
        wrapper.find('VariableListOption-stub').vm.$emit('input', 'appRequesters.view');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0][0]).toEqual([
          'appRequesters.date.month',
          'appRequesters.date.year',
          'appRequesters.view',
        ]);
      });

      it('... or remove it if already in', async () => {
        wrapper.find('VariableListOption-stub').vm.$emit('input', 'appRequesters.date.month');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0][0]).toEqual(['appRequesters.date.year']);
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should set selectedVariables default to empty string', () => {
      expect((wrapper.vm as any).selectedVariables).toStrictEqual('');
    });
    it('should set availableVariables to empty array', () => {
      expect((wrapper.vm as any).availableVariables).toStrictEqual([]);
    });
  });
});
