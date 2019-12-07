import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import FromDateStepForm from '@/components/stepforms/FromDateStepForm.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Convert Date to String Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FromDateStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input component', () => {
    const wrapper = shallowMount(FromDateStepForm, { store: emptyStore, localVue });
    expect(wrapper.findAll('columnpicker-stub').length).toEqual(1);
    expect(wrapper.findAll('inputtextwidget-stub').length).toEqual(1);
  });

  it('should update editedStep with the selected column at creation', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['foo'],
    });
    const wrapper = shallowMount(FromDateStepForm, {
      store,
      localVue,
      sync: false,
    });
    expect(wrapper.vm.$data.editedStep.column).toEqual('foo');
  });
});
