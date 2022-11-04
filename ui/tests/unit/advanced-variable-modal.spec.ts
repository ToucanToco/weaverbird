import { shallowMount, Wrapper } from '@vue/test-utils';

import AdvancedVariableModal from '@/components/stepforms/widgets/VariableInputs/AdvancedVariableModal.vue';

describe('Variable Chooser', () => {
  let wrapper: Wrapper<AdvancedVariableModal>;

  beforeEach(() => {
    wrapper = shallowMount(AdvancedVariableModal);
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

    it('should populate code editor with empty value', () => {
      expect((wrapper.vm as any).variableIdentifier).toBe('');
      expect(wrapper.find('CodeEditorWidget-stub').props().value).toBe('');
    });

    it('should disable the save button', () => {
      expect(wrapper.find('.vqb-modal__action--primary').classes()).toContain(
        'vqb-modal__action--disabled',
      );
    });
  });

  describe('with selected variable to update', () => {
    beforeEach(async () => {
      wrapper.setProps({ variable: '{{ a }}', isOpened: true });
      await wrapper.vm.$nextTick();
    });
    it('should init code editor with variable value without delimiters', () => {
      expect((wrapper.vm as any).variableIdentifier).toBe('a');
      expect(wrapper.find('CodeEditorWidget-stub').props().value).toBe('a');
    });
    it('should keep previous value on close', async () => {
      wrapper.setProps({ variable: '', isOpened: false });
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).value).toBe('a');
    });
  });

  describe('when updating the value', () => {
    beforeEach(async () => {
      wrapper.setProps({ isOpened: true });
      wrapper.find('CodeEditorWidget-stub').vm.$emit('input', '{{ a }}');
      await wrapper.vm.$nextTick();
    });

    it('should enable the save button', () => {
      expect(wrapper.find('.vqb-modal__action--primary').classes()).not.toContain(
        'vqb-modal__action--disabled',
      );
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
    beforeEach(() => {
      wrapper.setProps({ isOpened: true });
      wrapper.setData({ value: 'Test' });
    });

    it('should emit input with the value', async () => {
      wrapper.find('.vqb-modal__action--primary').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toBeTruthy();
      expect(wrapper.emitted().input[0][0]).toBe('Test');
    });

    it('.. unless value has not be updated ...', async () => {
      wrapper.setProps({ variable: '{{ Test }}' });
      wrapper.find('.vqb-modal__action--primary').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toBeFalsy();
    });

    it('.. or is empty', async () => {
      wrapper.setData({ value: '' });
      wrapper.find('.vqb-modal__action--primary').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toBeFalsy();
    });
  });
});
