import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import RenameStepForm from '@/components/stepforms/RenameStepForm.vue';
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
    const wrapper = shallowMount(RenameStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('rename');
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(RenameStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).to.equal(1);
  });

  it('should pass down the newname prop to widget value prop', async () => {
    const wrapper = shallowMount(RenameStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { name: 'rename', oldname: '', newname: 'foo' } });
    await localVue.nextTick();
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('foo');
  });

  it('should have a columnpicker widget', () => {
    const wrapper = shallowMount(RenameStepForm, { store: emptyStore, localVue });

    expect(wrapper.find('columnpicker-stub').exists()).to.be.true;
  });

  describe('Errors', () => {
    it('should report errors when oldname or newname is empty', async () => {
      const wrapper = mount(RenameStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
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
      const wrapper = mount(RenameStepForm, { store, localVue });
      wrapper.setData({ editedStep: { name: 'rename', oldname: 'columnA', newname: 'columnB' } });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
      }));
      expect(errors).to.eql([{ keyword: 'columnNameAlreadyUsed', dataPath: '.newname' }]);
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(RenameStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'rename', oldname: 'foo', newname: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'rename', newname: 'bar', oldname: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(RenameStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
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
    const wrapper = shallowMount(RenameStepForm, { store, localVue });
    expect(wrapper.vm.$data.editedStep.oldname).to.equal('');
    store.commit('toggleColumnSelection', { column: 'columnB' });
    await localVue.nextTick();
    expect(wrapper.vm.$data.editedStep.oldname).to.equal('columnB');
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
    const wrapper = mount(RenameStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });

  it('should make the focus on the column modified after rename validation', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(RenameStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'rename', oldname: 'columnA', newname: 'toto' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).to.eql(['toto']);
  });

  it('should not change the column focus if validation fails', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(RenameStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'rename', oldname: 'columnA', newname: 'columnB' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.selectedColumns).to.eql(['columnA']);
  });
});
