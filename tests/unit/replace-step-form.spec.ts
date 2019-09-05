import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import ReplaceStepForm from '@/components/stepforms/ReplaceStepForm.vue';
import Vuex, { Store } from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Replace Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ReplaceStepForm, { store: emptyStore, localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('replace');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(ReplaceStepForm, { store: emptyStore, localVue, sync: false });
    const columnPickerWrappers = wrapper.findAll('columnpicker-stub');
    const inputTextWrappers = wrapper.findAll('inputtextwidget-stub');
    const widgetListWrappers = wrapper.findAll('listwidget-stub');
    expect(columnPickerWrappers.length).toEqual(1);
    expect(inputTextWrappers.length).toEqual(1);
    expect(widgetListWrappers.length).toEqual(1);
  });

  it('should pass down "search_column" to ColumnPicker', () => {
    const wrapper = shallowMount(ReplaceStepForm, {
      store: emptyStore,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            to_replace: [['foo', 'bar']],
          },
        };
      },
    });
    expect(wrapper.find('columnpicker-stub').attributes().value).toEqual('test');
  });

  it('should pass down "new_column" to InputTextWidget', () => {
    const wrapper = shallowMount(ReplaceStepForm, {
      store: emptyStore,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            new_column: 'newTest',
            to_replace: [['foo', 'bar']],
          },
        };
      },
    });
    expect(wrapper.find('inputtextwidget-stub').props().value).toEqual('newTest');
  });

  it('should pass down "to_replace" to ListWidget', () => {
    const wrapper = shallowMount(ReplaceStepForm, {
      store: emptyStore,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            new_column: 'newTest',
            to_replace: [['foo', 'bar']],
          },
        };
      },
    });
    expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
  });

  it('should pass down the default "to_replace" to ListWidget', () => {
    const wrapper = shallowMount(ReplaceStepForm, {
      store: emptyStore,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            new_column: 'newTest',
            to_replace: [],
          },
        };
      },
    });
    expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
  });

  it('should report errors when the data is not valid', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }, { name: 'bar', type: 'string' }],
        data: [],
      },
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'foo',
            to_replace: [['', '']],
            new_column: 'bar',
          },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).toEqual([{ keyword: 'columnNameAlreadyUsed', dataPath: '.new_column' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }, { name: 'bar', type: 'string' }],
        data: [],
      },
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'foo',
            to_replace: [['hello', 'hi']],
          },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'replace',
            search_column: 'foo',
            to_replace: [['hello', 'hi']],
          },
        ],
      ],
    });
  });

  it('should convert input value to integer when the column data type is integer', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'integer' }],
        data: [[null]],
      },
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'columnA',
            to_replace: [['0', '42']],
          },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[0, 42]] }]],
    });
  });

  it('should convert input value to float when the column data type is float', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
        data: [[null]],
      },
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'columnA',
            to_replace: [['0', '42.3']],
          },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[0, 42.3]] }]],
    });
  });

  it('should convert input value to boolean when the column data type is boolean', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'boolean' }],
        data: [[null]],
      },
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      data: () => {
        return {
          editedStep: {
            name: 'replace',
            search_column: 'columnA',
            to_replace: [['false', 'true']],
          },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[false, true]] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(ReplaceStepForm, { store: emptyStore, localVue, sync: false });
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
    const store: Store<any> = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      propsData: { isStepCreation: true },
    });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
