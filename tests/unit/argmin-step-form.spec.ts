import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import ArgminStepForm from '@/components/stepforms/ArgminStepForm.vue';
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

describe('Argmin Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ArgminStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('argmin');
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ArgminStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetautocomplete-stub');
    const multiselectWrappers = wrapper.findAll('widgetmultiselect-stub');
    expect(autocompleteWrappers.length).to.equal(1);
    expect(multiselectWrappers.length).to.equal(1);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(ArgminStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'argmin', column: 'foo', groups: ['bar'] },
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
    const wrapper = shallowMount(ArgminStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');
    expect(widgetAutocomplete.attributes('options')).to.equal('columnA,columnB,columnC');
  });

  it('should report errors if column is empty', async () => {
    const wrapper = mount(ArgminStepForm, { store: emptyStore, localVue });
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
    const wrapper = mount(ArgminStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'argmin', column: 'foo', groups: ['bar'] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'argmin', column: 'foo', groups: ['bar'] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(ArgminStepForm, { store: emptyStore, localVue });
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
    const wrapper = mount(ArgminStepForm, {
      propsData: {
        initialStepValue: {
          name: 'argmin',
          column: 'columnA',
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ editedStep: { name: 'argmin', column: 'columnB' } });
    await wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).to.eql(['columnB']);
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'argmin', column: 'foo' },
      { name: 'argmin', column: 'baz' },
      { name: 'argmin', column: 'tic' },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(ArgminStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
