import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FillnaStepForm from '@/components/stepforms/FillnaStepForm.vue';
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

describe('Fillna Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).to.equal(1);
  });

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { column: '', value: 'foo' } });
    await localVue.nextTick();
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('foo');
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });

    expect(wrapper.find('widgetautocomplete-stub').exists()).to.be.true;
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FillnaStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');

    expect(widgetAutocomplete.attributes('options')).to.equal('columnA,columnB,columnC');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(FillnaStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.column' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = mount(FillnaStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'fillna', column: 'foo', value: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'fillna', column: 'foo', value: 'bar' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(FillnaStepForm, { store: emptyStore, localVue });
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
    const wrapper = shallowMount(FillnaStepForm, { store, localVue });
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
    const wrapper = mount(FillnaStepForm, {
      propsData: {
        initialValue: {
          name: 'fillna',
          column: 'columnA',
          value: '',
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
    const wrapper = mount(FillnaStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });

  it('should keep the focus on the column modified after rename validation', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      propsData: {
        initialStepValue: {
          name: 'fillna',
          column: 'columnA',
          value: '',
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
