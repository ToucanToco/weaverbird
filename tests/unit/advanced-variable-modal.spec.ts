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
      wrapper.find('.vqb-modal__action--primary').trigger('click');
      await wrapper.vm.$nextTick();
    });

    it('should emit close', () => {
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });
});
