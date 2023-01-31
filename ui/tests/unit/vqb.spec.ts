import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';

import Vqb from '@/components/Vqb.vue';
import { useVQBStore } from '@/store';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
const store = useVQBStore();

describe('Vqb', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Vqb, { pinia, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(store.isEditingStep).toBeFalsy();
  });
});
