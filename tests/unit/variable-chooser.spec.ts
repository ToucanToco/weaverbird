import { shallowMount, Wrapper } from '@vue/test-utils';

import VariableChooser from '@/components/stepforms/widgets/VariableInputs/VariableChooser.vue';

describe('Variable Chooser', () => {
  let wrapper: Wrapper<VariableChooser>;

  beforeEach(() => {
    wrapper = shallowMount(VariableChooser, {
      sync: false,
      propsData: {
        isOpened: false,
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

  it('should instantiate a popover', () => {
    expect(wrapper.find('popover-stub').exists()).toBeTruthy();
  });

  it('should present all available variables organized in sections', () => {
    const sections = wrapper.findAll('.widget-variable-chooser__options-section');
    expect(sections).toHaveLength(2);
    expect(
      sections
        .at(0)
        .find('.widget-variable-chooser__option-section-title')
        .text(),
    ).toEqual('App variables');
    expect(
      sections
        .at(1)
        .find('.widget-variable-chooser__option-section-title')
        .text(),
    ).toEqual('Story variables');
    const varsFromFirstSection = sections.at(0).findAll('.widget-variable-chooser__option');
    expect(varsFromFirstSection).toHaveLength(3);
  });

  it('should display variables current values along their names', () => {
    wrapper.findAll('.widget-variable-chooser__option').wrappers.forEach(w => {
      expect(w.find('.widget-variable-chooser__option-name').text()).not.toBe('');
      expect(w.find('.widget-variable-chooser__option-value').text()).not.toBe('');
    });
  });

  describe('when closing the popover', () => {
    beforeEach(async () => {
      wrapper.find('popover-stub').vm.$emit('closed');
      await wrapper.vm.$nextTick();
    });

    it('should emit close', () => {
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when choosing a variable', () => {
    beforeEach(async () => {
      wrapper.find('.widget-variable-chooser__option').trigger('click');
      await wrapper.vm.$nextTick();
    });

    it('should emit a new value with the chosen variable', () => {
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0]).toEqual(['appRequesters.view']);
    });
  });

  describe('multiple mode', () => {
    beforeEach(async () => {
      wrapper.setProps({
        isMultiple: true,
        selectedVariables: ['appRequesters.date.month', 'appRequesters.date.year'],
      });
    });

    it('should display checkboxes before options', () => {
      expect(wrapper.findAll('.widget-variable-chooser__option-toggle').length).toBe(5);
    });

    it('should highlight selected options', () => {
      expect(wrapper.findAll('.widget-variable-chooser__option--selected').length).toBe(2);
    });
  });
});
