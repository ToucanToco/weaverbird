import { shallowMount, Wrapper } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';

import extractVariableIdentifier from '@/components/stepforms/widgets/VariableInput/extract-variable-identifier';
import VariableInput from '@/components/stepforms/widgets/VariableInput/VariableInput.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<VariableInput>;

  beforeEach(() => {
    wrapper = shallowMount(VariableInput, {
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
      slots: {
        default: '<input type="text"/>',
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should contain the input in the default slot', () => {
    expect(wrapper.find("input[type='text']").exists()).toBe(true);
  });

  describe('the variable (x) button', () => {
    it('should be present', () => {
      expect(wrapper.find('.widget-input-variable__variable-toggle').exists()).toBe(true);
    });

    describe('when there is no available variables', () => {
      beforeEach(async () => {
        wrapper.setProps({
          availableVariables: [],
        });
        await wrapper.vm.$nextTick();
      });

      it('should not be present', () => {
        expect(wrapper.find('.widget-input-variable__variable-toggle').exists()).toBe(false);
      });
    });

    describe('when clicked', () => {
      beforeEach(async () => {
        wrapper.find('.widget-input-variable__variable-toggle').trigger('click');
        await wrapper.vm.$nextTick();
      });

      it('should display the variable chooser', () => {
        expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(true);
      });

      it('should present all available variables organized in sections', () => {
        const sections = wrapper.findAll('.widget-input-variable__options-section');
        expect(sections).toHaveLength(2);
        expect(
          sections
            .at(0)
            .find('.widget-input-variable__option-section-title')
            .text(),
        ).toEqual('App variables');
        expect(
          sections
            .at(1)
            .find('.widget-input-variable__option-section-title')
            .text(),
        ).toEqual('Story variables');
        const varsFromFirstSection = sections.at(0).findAll('.widget-input-variable__option');
        expect(varsFromFirstSection).toHaveLength(3);
      });

      it('should display variables current values along their names', () => {
        wrapper.findAll('.widget-input-variable__option').wrappers.forEach(w => {
          expect(w.find('.widget-input-variable__option-name').text()).not.toBe('');
          expect(w.find('.widget-input-variable__option-value').text()).not.toBe('');
        });
      });

      describe('when closing the popover', () => {
        beforeEach(async () => {
          wrapper.find('popover-stub').vm.$emit('closed');
          await wrapper.vm.$nextTick();
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(
            false,
          );
        });
      });

      describe('when choosing a variable', () => {
        beforeEach(async () => {
          wrapper.find('.widget-input-variable__option').trigger('click');
          await wrapper.vm.$nextTick();
        });

        it('should emit a new value with the chosen variable', () => {
          expect(wrapper.emitted('input')).toHaveLength(1);
          expect(wrapper.emitted('input')[0]).toEqual(['{{ appRequesters.view }}']);
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('.widget-input-variable__variable-chooser').props().visible).toBe(
            false,
          );
        });
      });
    });
  });

  describe('when value is not a variable', () => {
    beforeEach(() => {
      wrapper.setProps({
        value: 'hummus',
      });
    });

    it('should display the regular input slot', () => {
      expect(wrapper.find('.widget-input-variable__input-container').exists()).toBe(true);
    });
  });

  describe('when value is a variable', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: '{{ hummus }}',
      });
      await wrapper.vm.$nextTick();
    });

    it('should not display the regular input slot', () => {
      expect(wrapper.find('.widget-input-variable__input-container').exists()).toBe(false);
    });

    it('should display the variable container', () => {
      expect(wrapper.find('.widget-input-variable__variable-container').exists()).toBe(true);
    });

    it('should display the label of the variable without delimiters', () => {
      expect(wrapper.find('.widget-input-variable__variable-name').text()).toBe('hummus');
    });

    it('should compute the variable value as empty', () => {
      expect((wrapper as any).vm.variableValue).toBe('');
    });

    it('should nit display a tooltip on hover', () => {
      expect(wrapper.find('.widget-input-variable__tag').classes()).not.toContain(
        'has-weaverbird__tooltip',
      );
    });

    describe('if the variable is listed in available variables', () => {
      beforeEach(async () => {
        wrapper.setProps({
          availableVariables: [
            {
              label: 'The famous hummus',
              identifier: 'hummus',
              value: ['hummus', 'hummus'],
            },
          ],
        });
        await wrapper.vm.$nextTick();
      });

      it('should display the human-friendly label instead of the identifier', () => {
        expect(wrapper.find('.widget-input-variable__variable-name').text()).toBe(
          'The famous hummus',
        );
      });

      it('should compute the variable value', () => {
        expect((wrapper as any).vm.variableValue).toBe('hummus, hummus');
      });

      it('should display a tooltip on hover', () => {
        expect(wrapper.find('.widget-input-variable__tag').classes()).toContain(
          'has-weaverbird__tooltip',
        );
      });
    });

    describe('when dismissing the variable', () => {
      beforeEach(async () => {
        wrapper.find('.widget-input-variable__tag-close').trigger('click');
      });

      it('should reset the value', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0]).toEqual([undefined]);
      });
    });
  });

  describe('with a parent component which has an arrow', () => {
    beforeEach(() => {
      wrapper.setProps({ hasArrow: true });
    });
    it('should move the variable chooser toggle button away from arrow', () => {
      expect(wrapper.find('.widget-input-variable--parent-arrow').exists()).toBe(true);
    });
  });
});

describe('extractVariableIdentifier', () => {
  it('should extract simple variable names', () => {
    expect(
      extractVariableIdentifier('{{ hummus }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract variable names with dots', () => {
    expect(
      extractVariableIdentifier('{{ hummus.mtabal }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus.mtabal');
  });

  it('should extract variable names with other property access methods', () => {
    expect(
      extractVariableIdentifier("{{ hummus['mtabal'] }}", {
        start: '{{',
        end: '}}',
      }),
    ).toBe("hummus['mtabal']");
  });

  it('should extract variable names with any number of leading and trailing whitespaces', () => {
    expect(
      extractVariableIdentifier('     {{ hummus         }}  ', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract expressions', () => {
    expect(
      extractVariableIdentifier('{{ a + b }}  ', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('a + b');
  });

  it('should extract variables with different delimiters', () => {
    expect(
      extractVariableIdentifier('<%= croissant %>', {
        start: '<%=',
        end: '%>',
      }),
    ).toBe('croissant');
  });
});
