import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ConvertStepForm from '@/components/stepforms/ConvertStepForm.vue';

jest.mock('@/components/FAIcon.vue');

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Convert Data Type Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ConvertStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ConvertStepForm, { store: emptyStore, localVue });
    expect(wrapper.findAll('multiselectwidget-stub').length).toEqual(1);
    expect(wrapper.findAll('autocompletewidget-stub').length).toEqual(1);
  });
});
