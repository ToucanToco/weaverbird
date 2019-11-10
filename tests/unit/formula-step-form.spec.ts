import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import FormulaStepForm from '@/components/stepforms/FormulaStepForm.vue';
import { setupMockStore, RootState, ValidationError } from './utils';
import { Pipeline } from '@/lib/steps';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Formula Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FormulaStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('formula');
  });

  it('should have exactly 2 widgetinputtext component', () => {
    const wrapper = shallowMount(FormulaStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputWrappers.length).toEqual(2);
  });

  it('should pass down properties', async () => {
    const wrapper = shallowMount(FormulaStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' } });
    await localVue.nextTick();
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(0)
        .props('value'),
    ).toEqual('ColumnA * 2');
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(1)
        .props('value'),
    ).toEqual('foo');
  });

  describe('Errors', () => {
    it('should report errors when oldname or newname is empty', async () => {
      const wrapper = mount(FormulaStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).toEqual([
        { keyword: 'minLength', dataPath: '.formula' },
        { keyword: 'minLength', dataPath: '.new_column' },
      ]);
    });
  });

  describe('Warning', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      });
      const wrapper = shallowMount(FormulaStepForm, { store, localVue });
      wrapper.setData({ editedStep: { formula: '', new_column: 'columnA' } });
      await localVue.nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if new_column is not an already existing column name', async () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      });
      const wrapper = shallowMount(FormulaStepForm, { store, localVue });
      wrapper.setData({ editedStep: { formula: '', new_column: 'columnB' } });
      await localVue.nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toBeNull();
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(FormulaStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(FormulaStepForm, { store: emptyStore, localVue });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
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
    const store = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(FormulaStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });

  it('should make the focus on the column modified after validation', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FormulaStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.vqb.selectedColumns).toEqual(['foo']);
  });
});
