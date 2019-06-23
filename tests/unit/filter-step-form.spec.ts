import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';
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

describe('Filter Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly one widgetinputtext and two autocomplete components', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(inputWrappers.length).to.equal(1);
    const autocompleteWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(autocompleteWrappers.length).to.equal(2);
  });

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { column: '', value: 'foo', operator: 'nin' } });
    await localVue.nextTick();
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('foo');
    const operatorWrapper = wrapper.findAll('widgetautocomplete-stub').at(1);
    expect(operatorWrapper.props('value')).to.equal('nin');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FilterStepForm, { store, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetautocomplete-stub');

    expect(autocompleteWrappers.at(0).attributes('options')).to.equal('columnA,columnB,columnC');
    expect(autocompleteWrappers.at(1).attributes('options')).to.equal('eq,ne,gt,ge,lt,le,in,nin');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).to.eql([
      { keyword: 'minLength', dataPath: '.column' },
      { keyword: 'minLength', dataPath: '.value' },
    ]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = mount(FilterStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'filter', column: 'foo', value: 'bar', operator: 'gt' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'filter', column: 'foo', value: 'bar', operator: 'gt' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });

  it('should update step when selectedColumn is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FilterStepForm, { store, localVue });
    expect(wrapper.vm.$data.editedStep.column).to.equal('');
    store.commit('toggleColumnSelection', { column: 'columnB' });
    await localVue.nextTick();
    expect(wrapper.vm.$data.editedStep.column).to.equal('columnB');
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FilterStepForm, {
      propsData: {
        initialValue: {
          name: 'filter',
          column: 'columnA',
          value: '',
          operator: 'eq',
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ editedStep: { column: 'columnB', value: '' } });
    await wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).to.eql(['columnB']);
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(FilterStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });

  it('should keep the focus on the column modified after filter validation', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FilterStepForm, {
      propsData: {
        initialStepValue: {
          name: 'filter',
          column: 'columnA',
          value: '',
          operator: 'eq',
        },
      },
      store,
      localVue,
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(store.state.selectedColumns).to.eql(['columnA']);
  });
});
