import { shallowMount, Wrapper } from '@vue/test-utils';

import AdvancedVariableModal from '@/components/stepforms/widgets/VariableInputs/AdvancedVariableModal.vue';

describe('Variable Chooser', () => {
  let wrapper: Wrapper<AdvancedVariableModal>;

  beforeEach(() => {
    wrapper = shallowMount(AdvancedVariableModal, {
      propsData: {
        variableDelimiters: { start: '{{', end: '}}', type: ' | ' },
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  describe('when the modal is closed', () => {
    it('should not show the modal container', () => {
      expect(wrapper.find('.vqb-modal__container').exists()).toBe(false);
    });
  });

  describe('when opening the modal', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      await wrapper.vm.$nextTick();
    });

    it('should have a title', () => {
      expect(wrapper.find('.vqb-modal__title').text()).toBe('Custom Variable');
    });

    it('should have a close button', () => {
      expect(wrapper.find('.vqb-modal__close').exists()).toBe(true);
    });

    it('should have a save button', () => {
      expect(wrapper.find('.vqb-modal__action--primary').exists()).toBe(true);
    });

    it('should have a cancel button', () => {
      expect(wrapper.find('.vqb-modal__action--secondary').exists()).toBe(true);
    });

    it('should have a code editor input', () => {
      expect(wrapper.find('CodeEditorWidget-stub').exists()).toBe(true);
    });

    // it('should have a name input', () => {
    //   expect(wrapper.find('InputTextWidget-stub').exists()).toBe(true);
    // });

    it('should have a type input', () => {
      expect(wrapper.find('AutocompleteWidget-stub').exists()).toBe(true);
    });
  });

  describe('when clicking on the close button', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      wrapper.find('.vqb-modal__close').trigger('click');
      await wrapper.vm.$nextTick();
    });

    it('should emit close', () => {
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when clicking on the cancel button', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      wrapper.find('.vqb-modal__action--secondary').trigger('click');
      await wrapper.vm.$nextTick();
    });

    it('should emit close', () => {
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when clicking on the save button', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      wrapper.setData({ variable: { type: '', code: '<%= "a" === "a" %>' } });
      wrapper.find('.vqb-modal__action--primary').trigger('click');
      await wrapper.vm.$nextTick();
    });

    it('should emit the formatted variable as string', () => {
      expect(wrapper.emitted().input).toStrictEqual([['<%= "a" === "a" %>']]);
    });
  });

  describe('when updating the type', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      wrapper.setData({ variable: { type: '', code: '<%= "a" === "a" %>' } });
      wrapper
        .find('AutocompleteWidget-stub')
        .vm.$emit('input', { type: ' | number', label: 'Number' });
      await wrapper.vm.$nextTick();
    });

    it('should update the variable type', () => {
      expect((wrapper.vm as any).variable.type).toBe(' | number');
    });

    it('should replace value in type field', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toStrictEqual({
        type: ' | number',
        label: 'Number',
      });
    });
  });

  describe('casting', () => {
    let typeField: any;
    beforeEach(() => {
      wrapper.setProps({ isOpened: true });
      wrapper.setData({ variable: { type: '', code: '<%= "a" === "a" ? 1 : 2 %>' } });
      typeField = wrapper.find('AutocompleteWidget-stub');
      typeField.vm.$emit('input', { type: ' | number', label: 'Number' });
    });

    it('should add delimiters and type to value with type', () => {
      const formattedVariable = (wrapper.vm as any).formattedVariable;
      expect(formattedVariable).toStrictEqual('{{ <%= "a" === "a" ? 1 : 2 %> | number }}');
    });

    it('should remove delimiters in value without type', () => {
      typeField.vm.$emit('input', { type: '', label: 'Text' });
      const formattedVariable = (wrapper.vm as any).formattedVariable;
      expect(formattedVariable).toStrictEqual('<%= "a" === "a" ? 1 : 2 %>');
    });
  });
});
