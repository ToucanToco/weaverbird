import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { Pipeline } from '@/lib/steps';
import { VQBState } from '@/store/state';
import WidgetCheckbox from '@/components/stepforms/WidgetCheckbox.vue';

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
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have 5 input components', () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetmultiselect-stub');
    expect(autocompleteWrappers.length).toEqual(2);
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(inputWrappers.length).toEqual(2);
    const checkboxWrappers = wrapper.findAll('widgetcheckbox-stub');
    expect(checkboxWrappers.length).toEqual(1);
  });

  it('should pass down props to widgets', () => {
    const wrapper = shallowMount(UnpivotStepForm, {
      store: emptyStore,
      localVue,
      data: () => {
        return {
          editedStep: {
            name: 'unpivot',
            keep: ['foo', 'bar'],
            unpivot: ['baz'],
            unpivot_column_name: 'spam',
            value_column_name: 'eggs',
            dropna: false,
          },
        };
      },
    });
    expect(wrapper.find('#keepColumnInput').props('value')).toEqual(['foo', 'bar']);
    expect(wrapper.find('#unpivotColumnInput').props('value')).toEqual(['baz']);
    expect(wrapper.find('#unpivotColumnNameInput').props('value')).toEqual('spam');
    expect(wrapper.find('#valueColumnNameInput').props('value')).toEqual('eggs');
    const widgetCheckbox = wrapper.find(WidgetCheckbox);
    expect(widgetCheckbox.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(UnpivotStepForm, { store, localVue });
    expect(wrapper.find('#keepColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('#unpivotColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });

  describe('Errors', () => {
    it('should report errors when fields are missing', async () => {
      const wrapper = mount(UnpivotStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).toEqual([
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
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).toEqual([
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
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).toEqual([
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
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
      message: err.message,
    }));
    expect(errors).toEqual([
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
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
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
    const wrapper = mount(UnpivotStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });
});
