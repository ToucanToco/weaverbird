import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ToDateStepForm from '@/components/stepforms/ToDateStepForm.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Connvert STring to Date Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ToDateStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 1 input component', () => {
    const wrapper = shallowMount(ToDateStepForm, { store: emptyStore, localVue });
    expect(wrapper.findAll('columnpicker-stub').length).toEqual(1);
  });

  it('should update editedStep with the selected column at creation', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['foo'],
    });
    const wrapper = shallowMount(ToDateStepForm, {
      store,
      localVue,
      sync: false,
    });
    expect(wrapper.vm.$data.editedStep.column).toEqual('foo');
  });
});
