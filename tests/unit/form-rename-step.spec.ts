import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { Pipeline } from '@/lib/steps';
import { VQBState } from '@/store/state';
import FormRenameStep from '@/components/FormRenameStep.vue';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';

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
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).to.equal(1);
  });

  it('should pass down the newname prop to widget value prop', async () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    wrapper.setData({ step: { oldname: '', newname: 'foo' } });
    await Vue.nextTick();
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('foo');
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.find('widgetautocomplete-stub').exists()).to.be.true;
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

    expect(widgetAutocomplete.attributes('options')).to.equal('columnA,columnB,columnC');
  });

  describe('Errors', () => {
    it('should report errors when oldname or newname is empty', async () => {
      const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await Vue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).to.eql([
        { keyword: 'minLength', dataPath: '.newname' },
        { keyword: 'minLength', dataPath: '.oldname' },
      ]);
    });

    it('should report errors when newname is an already existing column name', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = shallowMount(FormRenameStep, { store, localVue });
      wrapper.setData({ step: { oldname: 'columnA', newname: 'columnB' } });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await Vue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
      }));
      expect(errors).to.eql([{ keyword: 'nameAlreadyUsed', dataPath: '.newname' }]);
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = shallowMount(FormRenameStep, {
      store: emptyStore,
      localVue,
      propsData: {
        initialValue: { oldname: 'foo', newname: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await Vue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'rename', newname: 'bar', oldname: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await Vue.nextTick();
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
    const wrapper = shallowMount(FormRenameStep, { store, localVue });
    expect(wrapper.vm.$data.step.oldname).to.equal('');
    store.commit('toggleColumnSelection', 'columnB');
    await Vue.nextTick();
    expect(wrapper.vm.$data.step.oldname).to.equal('columnB');
  });

  it('should update selectedColumn when oldname is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FormRenameStep, {
      propsData: {
        initialValue: {
          oldname: 'columnA',
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ step: { oldname: 'columnB', new_name: '' } });
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
    const wrapper = shallowMount(FormRenameStep, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });

  it('should make the focus on the column modified after rename validation', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FormRenameStep, { store, localVue });
    wrapper.setData({ step: { oldname: 'columnA', newname: 'toto' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).toEqual(['toto']);
  });
});
