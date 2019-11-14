import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import AppendStepForm from '@/components/stepforms/AppendStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';
import { Pipeline } from '@/lib/steps';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Append Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(AppendStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('append');
  });

  it('should have a widget multiselect', () => {
    const wrapper = shallowMount(AppendStepForm, { store: emptyStore, localVue });
    expect(wrapper.find('multiselectwidget-stub').exists()).toBeTruthy();
  });

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const store = setupMockStore({
      pipelines: {
        dataset1: [{ name: 'domain', domain: 'domain1' }],
        dataset2: [{ name: 'domain', domain: 'domain2' }],
      },
    });
    const wrapper = shallowMount(AppendStepForm, { store, localVue });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.attributes('options')).toEqual('dataset1,dataset2');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(AppendStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toEqual([{ keyword: 'minItems', dataPath: '.pipelines' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = mount(AppendStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'append', pipelines: ['dataset1', 'dataset2'] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'append', pipelines: ['dataset1', 'dataset2'] }]],
    });
  });

  it('should emit "cancel" event when edition is canceled', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ];
    const store = setupMockStore({
      pipeline,
      selectedStepIndex: 1,
    });

    const wrapper = mount(AppendStepForm, { store, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).toEqual({ cancel: [[]] });
    expect(store.state.vqb.selectedStepIndex).toEqual(1);
    expect(store.state.vqb.pipeline).toEqual([
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ]);
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
    const wrapper = mount(AppendStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
