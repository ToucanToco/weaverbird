import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import DuplicateColumnStepForm from '@/components/stepforms/DuplicateColumnStepForm.vue';
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

describe('Duplicate Column Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(DuplicateColumnStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(DuplicateColumnStepForm, { store: emptyStore, localVue });

    expect(wrapper.findAll('columnpicker-stub').length).to.equal(1);
    expect(wrapper.findAll('widgetinputtext-stub').length).to.equal(1);
  });

  describe('Errors', () => {
    it('should report errors when submitted data is not valid', () => {
      const wrapper = mount(DuplicateColumnStepForm, {
        store: emptyStore,
        localVue,
        propsData: {
          initialStepValue: { name: 'duplicate', column: '', new_column_name: '' },
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
      }));
      expect(errors).to.eql([
        { keyword: 'minLength', dataPath: '.column' },
        { keyword: 'minLength', dataPath: '.new_column_name' },
      ]);
    });
  });

  it('should report errors when new_column_name is an already existing column name', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(DuplicateColumnStepForm, { store, localVue });
    wrapper.setData({
      editedStep: { name: 'duplicate', column: 'foo', new_column_name: 'columnA' },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).to.eql([{ keyword: 'columnNameAlreadyUsed', dataPath: '.new_column_name' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = mount(DuplicateColumnStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'duplicate', column: 'foo', new_column_name: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'duplicate', column: 'foo', new_column_name: 'bar' }]],
    });
  });

  it('should emit "cancel" event when edition is canceled', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 1,
    });

    const wrapper = mount(DuplicateColumnStepForm, { store, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).to.eql({ cancel: [[]] });
    expect(store.state.selectedStepIndex).to.equal(1);
    expect(store.state.pipeline).to.eql([
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ]);
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
    const wrapper = mount(DuplicateColumnStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
