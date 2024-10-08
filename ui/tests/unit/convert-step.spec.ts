import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ConvertStepForm from '@/components/stepforms/ConvertStepForm.vue';

vi.mock('@/components/FAIcon.vue');

const localVue = createLocalVue();

describe('Convert Data Type Step Form', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ConvertStepForm, { localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ConvertStepForm, { localVue });
    expect(wrapper.findAll('multiselectwidget-stub').length).toEqual(1);
    expect(wrapper.findAll('autocompletewidget-stub').length).toEqual(1);
  });
});
