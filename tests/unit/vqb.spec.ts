import { createLocalVue,shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import { setupStore } from '@/store';

import Vqb from '../../src/components/Vqb.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Vqb', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Vqb, { store: setupStore(), localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$store.state.isEditingStep).toBeFalsy();
  });
});
