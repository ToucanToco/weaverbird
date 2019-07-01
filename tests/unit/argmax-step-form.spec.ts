import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import ArgmaxStepForm from '@/components/stepforms/ArgmaxStepForm.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { Pipeline } from '@/lib/steps';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Argmax Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('argmax');
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetautocomplete-stub');
    const multiselectWrappers = wrapper.findAll('widgetmultiselect-stub');
    expect(autocompleteWrappers.length).to.equal(1);
    expect(multiselectWrappers.length).to.equal(1);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'argmax', column: 'foo', groups: ['bar'] },
    });
    await localVue.nextTick();
    expect(wrapper.find('widgetautocomplete-stub').props('value')).to.equal('foo');
    expect(wrapper.find('widgetmultiselect-stub').props('value')).to.eql(['bar']);
  });

  it('should instantiate an autocomplet widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(ArgmaxStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');
    expect(widgetAutocomplete.attributes('options')).to.equal('columnA,columnB,columnC');
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
    expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.column' }]);
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
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'argmax', column: 'foo', groups: ['bar'] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(ArgmaxStepForm, {
      propsData: {
        initialStepValue: {
          name: 'argmax',
          column: 'columnA',
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ editedStep: { name: 'argmax', column: 'columnB' } });
    await wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).to.eql(['columnB']);
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'argmax', column: 'foo' },
      { name: 'argmax', column: 'baz' },
      { name: 'argmax', column: 'tic' },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(ArgmaxStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
