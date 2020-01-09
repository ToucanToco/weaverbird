import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ReplaceStepForm from '@/components/stepforms/ReplaceStepForm.vue';
import { Pipeline } from '@/lib/steps';

import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Replace Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ReplaceStepForm, { store: emptyStore, localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('replace');
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(ReplaceStepForm, { store: emptyStore, localVue, sync: false });
    const columnPickerWrappers = wrapper.findAll('columnpicker-stub');
    const widgetListWrappers = wrapper.findAll('listwidget-stub');
    expect(columnPickerWrappers.length).toEqual(1);
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
            to_replace: [],
          },
        };
      },
    });
    expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
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
    const wrapper = mount(ReplaceStepForm, {
      store,
      localVue,
      sync: false,
      propsData: { isStepCreation: true },
    });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
