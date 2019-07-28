import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FormulaStepForm from '@/components/stepforms/FormulaStepForm.vue';
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

describe('Rename Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
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

    it('should report errors when newname is an already existing column name', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(FormulaStepForm, { store, localVue });
      wrapper.setData({
        editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'columnB' },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
      }));
      expect(errors).toEqual([{ keyword: 'columnNameAlreadyUsed', dataPath: '.new_column' }]);
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
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
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
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(FormulaStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });

  it('should make the focus on the column modified after validation', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FormulaStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).toEqual(['foo']);
  });

  it('should not change the column focus if validation fails', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FormulaStepForm, { store, localVue });
    wrapper.setData({
      editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'columnB' },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).toEqual(['columnA']);
  });
});
