import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import SplitStepForm from '@/components/stepforms/SplitStepForm.vue';
import { Pipeline } from '@/lib/steps';

import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Split Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(SplitStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('split');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(SplitStepForm, { store: emptyStore, localVue });
    expect(wrapper.find('#columnToSplit').exists()).toBeTruthy();
    expect(wrapper.find('#delimiter').exists()).toBeTruthy();
    expect(wrapper.find('#numberColsToKeep').exists()).toBeTruthy();
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(SplitStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'split', column: 'foo', delimiter: '-', number_cols_to_keep: 3 },
    });
    await localVue.nextTick();
    expect(wrapper.find('#delimiter').props('value')).toEqual('-');
    expect(wrapper.find('#numberColsToKeep').props('value')).toEqual(3);
  });

  it('should report errors when column is empty', async () => {
    const wrapper = mount(SplitStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).toEqual([
      { keyword: 'required', dataPath: '' },
      { keyword: 'minLength', dataPath: '.column' },
      { keyword: 'minLength', dataPath: '.delimiter' },
    ]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(SplitStepForm, {
      store: emptyStore,
      localVue,
      sync: false,
      propsData: {
        initialStepValue: { name: 'split', column: 'foo', delimiter: '-', number_cols_to_keep: 3 },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'split', column: 'foo', delimiter: '-', number_cols_to_keep: 3 }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(SplitStepForm, { store: emptyStore, localVue });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ];
    const store = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(SplitStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
