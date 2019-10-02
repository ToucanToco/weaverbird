import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import PercentageStepForm from '@/components/stepforms/PercentageStepForm.vue';
import Vuex, { Store } from 'vuex';
import { VQBnamespace } from '@/store';
import { setupMockStore } from './utils';
import { Pipeline } from '@/lib/steps';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Percentage Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('percentage');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('columnpicker-stub');
    const multiselectWrappers = wrapper.findAll('multiselectwidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
    expect(multiselectWrappers.length).toEqual(1);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'percentage', column: 'foo', group: ['test'] },
    });
    await localVue.nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['test']);
  });

  describe('Errors', () => {
    it('should report errors when column is empty', async () => {
      const wrapper = mount(PercentageStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.column' }]);
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(PercentageStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'percentage', column: 'foo', group: ['test'] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'percentage', column: 'foo', group: ['test'] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(PercentageStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'percentage', column: 'foo' },
      { name: 'percentage', column: 'baz' },
      { name: 'percentage', column: 'tic' },
    ];
    const store: Store<any> = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(PercentageStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });

  it('should update step when selectedColumn is changed', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(PercentageStepForm, { store, localVue });
    expect(wrapper.vm.$data.editedStep.column).toEqual('');
    store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await localVue.nextTick();
    expect(wrapper.vm.$data.editedStep.column).toEqual('columnB');
  });
});
