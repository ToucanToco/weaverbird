import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FormFillnaStep from '@/components/FormFillnaStep.vue';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';
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

describe('Form Rename Step', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).toEqual(1);
  });

  it('should pass down the value prop to widget value prop', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });
    wrapper.setData({ step: { column: '', value: 'foo' } });

    expect(wrapper.find('widgetinputtext-stub').props('value')).toEqual('foo');
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });

    expect(wrapper.find('widgetautocomplete-stub').exists()).toBeTruthy();
  });

  it('should instantiate an autocomplet widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FormFillnaStep, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.column' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = shallowMount(FormFillnaStep, {
      store: emptyStore,
      localVue,
      propsData: {
        initialValue: { column: 'foo', value: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'foo', value: 'bar' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = shallowMount(FormFillnaStep, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should update step when selectedColumn is changed', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FormFillnaStep, { store, localVue });
    expect(wrapper.vm.$data.step.column).toEqual('');
    store.commit('toggleColumnSelection', { column: 'columnB' });
    expect(wrapper.vm.$data.step.column).toEqual('columnB');
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FormFillnaStep, {
      propsData: {
        initialValue: {
          column: 'columnA',
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ step: { column: 'columnB', value: '' } });
    await wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).toEqual(['columnB']);
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
    const wrapper = shallowMount(FormFillnaStep, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });

  it('should keep the focus on the column modified after rename validation', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FormFillnaStep, { store, localVue });
    wrapper.setData({ step: { column: 'columnA', value: 'toto' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).toEqual(['columnA']);
  });
});
