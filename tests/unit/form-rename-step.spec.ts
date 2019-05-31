import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FormRenameStep from '@/components/FormRenameStep.vue';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';

const localVue = createLocalVue();
localVue.use(Vuex);

const emptyStore = setupStore({});

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Form Rename Step', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).toEqual(1);
  });

  it('should pass down the newname prop to widget value prop', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    wrapper.setData({ step: { oldname: '', newname: 'foo' } });

    expect(wrapper.find('widgetinputtext-stub').props('value')).toEqual('foo');
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.find('widgetautocomplete-stub').exists()).toBeTruthy();
  });

  it('should instantiate an autocomplet widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FormRenameStep, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).toEqual([
      { keyword: 'minLength', dataPath: '.newname' },
      { keyword: 'minLength', dataPath: '.oldname' },
    ]);
  });

  it('should validate and emit "formSavaed" when submitted data is valid', () => {
    const wrapper = shallowMount(FormRenameStep, {
      store: emptyStore,
      localVue,
      propsData: {
        initialValue: { oldname: 'foo', newname: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'rename', newname: 'bar', oldname: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
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
    const wrapper = shallowMount(FormRenameStep, { store, localVue });
    expect(wrapper.vm.$data.step.oldname).toEqual('');
    store.commit('toggleColumnSelection', 'columnB');
    expect(wrapper.vm.$data.step.oldname).toEqual('columnB');
  });

  it('should update selectedColumn when oldname is changed', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FormRenameStep, { store, localVue });
    wrapper.setData({ step: { oldname: 'columnB', new_name: '' } });
    wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).toEqual(['columnB']);
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const store = setupStore({
      selectedStepIndex: 2,
    });
    const wrapper = mount(FormRenameStep, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });
});
