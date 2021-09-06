import { shallowMount, Wrapper } from '@vue/test-utils';

import StepFormHeader from '@/components/stepforms/StepFormHeader.vue';

jest.mock('@/components/FAIcon.vue');

describe('StepFormHeader', () => {
  let wrapper: Wrapper<StepFormHeader>;

  beforeEach(() => {
    wrapper = shallowMount(StepFormHeader, {
      sync: false,
      propsData: {
        version: '0.0.1',
        title: 'Yololol',
        stepName: 'yolo',
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display the title', () => {
    expect(wrapper.find('.step-edit-form__title-container').text()).toBe('Yololol');
  });

  it('should display the stepName in doc link', () => {
    expect(wrapper.find('.step-edit-form__link').attributes().href).toContain('yolo');
  });

  it('should display the version in doc link', () => {
    expect(wrapper.find('.step-edit-form__link').attributes()['data-version']).toBe('0.0.1');
  });

  it('should not display the backend error', () => {
    expect(wrapper.find('.step-edit-form__error').exists()).toBe(false);
  });

  describe('with backend error', () => {
    beforeEach(() => {
      wrapper.setProps({ backendError: 'error' });
    });

    it('should display the backend error', () => {
      expect(wrapper.find('.step-edit-form__error').exists()).toBe(true);
    });

    it('should display the correct backend error message', () => {
      expect(wrapper.find('.step-edit-form__error').text()).toBe('error');
    });
  });
});
