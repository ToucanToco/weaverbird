import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';
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
    expect(wrapper.vm.$data.stepname).equal('filter');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    expect(wrapper.findAll('widgetinputtext-stub').length).to.equal(1);
    expect(wrapper.findAll('widgetautocomplete-stub').length).to.equal(1);
    expect(wrapper.findAll('columnpicker-stub').length).to.equal(1);
  });

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { column: '', value: 'foo', operator: 'nin' } });
    await localVue.nextTick();
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('foo');
    const operatorWrapper = wrapper.find('#filterOperator');
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
    const filterWrapper = wrapper.find('#filterOperator');
    expect(filterWrapper.attributes('options')).to.equal('eq,ne,gt,ge,lt,le,in,nin');
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
