import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { Pipeline } from '@/lib/steps';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
  message: string;
}

describe('Unpivot Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
  });

  it('should have 5 input components', () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetmultiselect-stub');
    expect(autocompleteWrappers.length).to.equal(2);
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(inputWrappers.length).to.equal(2);
    const checkboxWrappers = wrapper.findAll('input');
    expect(checkboxWrappers.length).to.equal(1);
  });

  it('should pass down props to widgets', async () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: {
        name: 'unpivot',
        keep: ['foo', 'bar'],
        unpivot: ['baz'],
        unpivot_column_name: 'spam',
        value_column_name: 'eggs',
        dropna: false,
      },
    });
    await Vue.nextTick();
    expect(wrapper.find('#keepColumnInput').props('value')).to.eql(['foo', 'bar']);
    expect(wrapper.find('#unpivotColumnInput').props('value')).to.eql(['baz']);
    expect(wrapper.find('#unpivotColumnNameInput').props('value')).to.equal('spam');
    expect(wrapper.find('#valueColumnNameInput').props('value')).to.equal('eggs');
    const input: HTMLInputElement = wrapper.find('#dropna').element as HTMLInputElement;
    expect(input.value).to.equal('on');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(UnpivotStepForm, { store, localVue });
    expect(wrapper.find('#keepColumnInput').attributes('options')).to.equal(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('#unpivotColumnInput').attributes('options')).to.equal(
      'columnA,columnB,columnC',
    );
  });

  describe('Errors', () => {
    it('should report errors when fields are missing', async () => {
      const wrapper = mount(UnpivotStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await Vue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).to.eql([
        { keyword: 'minItems', dataPath: '.keep' },
        { keyword: 'minItems', dataPath: '.unpivot' },
        { keyword: 'minLength', dataPath: '.unpivot_column_name' },
        { keyword: 'minLength', dataPath: '.value_column_name' },
      ]);
    });

    it('should report errors when keep and unpivot column names overlap', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(UnpivotStepForm, { store, localVue });
      wrapper.setData({
        editedStep: {
          name: 'unpivot',
          keep: ['columnA', 'columnC'],
          unpivot: ['columnA', 'columnB', 'columnC'],
          unpivot_column_name: 'foo',
          value_column_name: 'bar',
          dropna: true,
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await Vue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).to.eql([
        {
          keyword: 'columnNameConflict',
          dataPath: '.unpivot',
          message: 'Column names columnA,columnC were used for both "keep" and "unpivot" fields',
        },
      ]);
    });

    it('should report errors when the unpivot_column_name value is already used', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(UnpivotStepForm, { store, localVue });
      wrapper.setData({
        editedStep: {
          name: 'unpivot',
          keep: ['columnA'],
          unpivot: ['columnB', 'columnC'],
          unpivot_column_name: 'columnA',
          value_column_name: 'bar',
          dropna: true,
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await Vue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).to.eql([
        {
          keyword: 'columnNameConflict',
          dataPath: '.unpivot_column_name',
          message: 'Column name columnA is used at least twice but should be unique',
        },
      ]);
    });
  });

  it('should report errors when the value_column_name value is already used', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(UnpivotStepForm, { store, localVue });
    wrapper.setData({
      editedStep: {
        name: 'unpivot',
        keep: ['columnA'],
        unpivot: ['columnB', 'columnC'],
        unpivot_column_name: 'foo',
        value_column_name: 'columnB',
        dropna: true,
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await Vue.nextTick();
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
      message: err.message,
    }));
    expect(errors).to.eql([
      {
        keyword: 'columnNameConflict',
        dataPath: '.value_column_name',
        message: 'Column name columnB is used at least twice but should be unique',
      },
    ]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(UnpivotStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'unpivot',
          keep: ['columnA', 'columnB'],
          unpivot: ['columnC'],
          unpivot_column_name: 'foo',
          value_column_name: 'bar',
          dropna: true,
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await Vue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [
        [
          {
            name: 'unpivot',
            keep: ['columnA', 'columnB'],
            unpivot: ['columnC'],
            unpivot_column_name: 'foo',
            value_column_name: 'bar',
            dropna: true,
          },
        ],
      ],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(UnpivotStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await Vue.nextTick();
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
    const wrapper = mount(UnpivotStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
