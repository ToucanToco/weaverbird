import { shallowMount, Wrapper } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';

import VariableList from '@/components/stepforms/widgets/VariableInputs/VariableList.vue';

describe('Variable List', () => {
  let wrapper: Wrapper<VariableList>;

  beforeEach(() => {
    wrapper = shallowMount(VariableList, {
      sync: false,
      directives: {
        tooltip: VTooltip,
      },
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
        selectedVariables: ['appRequesters.city'],
      },
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
    const varsFromFirstSection = sections.at(0).findAll('.widget-variable-list__option');
    expect(varsFromFirstSection).toHaveLength(4);
  });

  it('should display variables current values along their names', () => {
    wrapper.findAll('.widget-variable-list__option').wrappers.forEach(w => {
      expect(w.find('.widget-variable-list__option-name').text()).not.toBe('');
      expect(w.find('.widget-variable-list__option-value').text()).not.toBe('');
    });
  });

  it('should display dates values in UTC timezone', () => {
    expect(
      wrapper
        .findAll('.widget-variable-list__option')
        .at(3)
        .find('.widget-variable-list__option-value')
        .text(),
    ).toStrictEqual('Fri, 11 Jun 2021 08:09:17 GMT');
  });

  it('should highlight selected option', () => {
    expect(
      wrapper
        .find('.widget-variable-list__option--selected')
        .find('.widget-variable-list__option-value')
        .text(),
    ).toEqual('New York');
  });

  describe('tooltip', () => {
    it('should display a value tooltip for each variable', () => {
      wrapper.findAll('.widget-variable-list__option').wrappers.forEach(w => {
        expect(w.classes()).toContain('has-weaverbird__tooltip');
      });
    });

    it('should display readable value in tooltip', () => {
      expect((wrapper.vm as any).makeValueReadable([])).toStrictEqual('[]');
      expect((wrapper.vm as any).makeValueReadable([1, 2])).toStrictEqual('[1,2]');
      expect((wrapper.vm as any).makeValueReadable(1)).toStrictEqual('1');
      expect((wrapper.vm as any).makeValueReadable('1')).toStrictEqual('"1"');
      expect((wrapper.vm as any).makeValueReadable(undefined)).toStrictEqual(undefined);
      expect((wrapper.vm as any).makeValueReadable(new Date(1623398957013))).toStrictEqual(
        `"${new Date(1623398957013).toUTCString()}"`,
      );
    });
  });

  describe('when choosing a variable', () => {
    beforeEach(async () => {
      wrapper.find('.widget-variable-list__option').trigger('click');
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
      expect(wrapper.findAll('.widget-variable-list__option-toggle').length).toBe(6);
    });

    it('should highlight selected options', () => {
      expect(wrapper.findAll('.widget-variable-list__option--selected').length).toBe(2);
    });
  });
});
