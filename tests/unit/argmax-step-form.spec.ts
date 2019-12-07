import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ArgmaxStepForm from '@/components/stepforms/ArgmaxStepForm.vue';
import { Pipeline } from '@/lib/steps';

import { setupMockStore, RootState } from './utils';


const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Argmax Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('argmax');
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('columnpicker-stub');
    const multiselectWrappers = wrapper.findAll('multiselectwidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
    expect(multiselectWrappers.length).toEqual(1);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'argmax', column: 'foo', groups: ['bar'] },
    });
    await localVue.nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['bar']);
  });

  it('should report errors if column is empty', async () => {
    const wrapper = mount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.column' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(ArgmaxStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'argmax', column: 'foo', groups: ['bar'] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'argmax', column: 'foo', groups: ['bar'] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'argmax', column: 'foo' },
      { name: 'argmax', column: 'baz' },
      { name: 'argmax', column: 'tic' },
    ];
    const store = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(ArgmaxStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
