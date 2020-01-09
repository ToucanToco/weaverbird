import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import FillnaStepForm from '@/components/stepforms/FillnaStepForm.vue';
import { Pipeline } from '@/lib/steps';
import { VQBnamespace } from '@/store';

import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Fillna Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('fillna');
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('inputtextwidget-stub');

    expect(inputWrappers.length).toEqual(1);
  });

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { column: '', value: 'foo' } });
    await localVue.nextTick();
    expect(wrapper.find('inputtextwidget-stub').props('value')).toEqual('foo');
  });

  it('should have a columnpicker widget', () => {
    const wrapper = shallowMount(FillnaStepForm, { store: emptyStore, localVue });

    expect(wrapper.find('columnpicker-stub').exists()).toBeTruthy();
  });

  it('should report errors when submitted data is not valid', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'columnA', value: { foo: 'bar' } },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toEqual([{ keyword: 'type', dataPath: '.value' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'foo', value: 'bar' },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'foo', value: 'bar' }]],
    });
  });

  it('should convert input value to integer when the column data type is integer', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'integer' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'columnA', value: '42' },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'columnA', value: 42 }]],
    });
  });

  it('should convert input value to float when the column data type is float', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'columnA', value: '42.3' },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'columnA', value: 42.3 }]],
    });
  });

  it('should convert input value to boolean when the column data type is boolean', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'boolean' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'columnA', value: 'true' },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    wrapper.setData({ editedStep: { name: 'fillna', column: 'columnA', value: 'false' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [{ name: 'fillna', column: 'columnA', value: true }],
        [{ name: 'fillna', column: 'columnA', value: false }],
      ],
    });
  });

  it('should accept templatable values', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'integer' }],
        data: [[null]],
      },
      variables: {
        foo: 'bla',
      },
    });
    const wrapper = mount(FillnaStepForm, {
      store,
      localVue,
      data: () => {
        return {
          editedStep: { name: 'fillna', column: 'foo', value: '<%= foo %>' },
        };
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'foo', value: '<%= foo %>' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(FillnaStepForm, { store: emptyStore, localVue });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should update step when selectedColumn is changed', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FillnaStepForm, { store, localVue });
    expect(wrapper.vm.$data.editedStep.column).toEqual('');
    store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await localVue.nextTick();
    expect(wrapper.vm.$data.editedStep.column).toEqual('columnB');
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
    const wrapper = mount(FillnaStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });

  it('should keep the focus on the column modified after rename validation', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(FillnaStepForm, {
      propsData: {
        initialStepValue: {
          name: 'fillna',
          column: 'columnA',
          value: '',
        },
      },
      store,
      localVue,
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(store.state.vqb.selectedColumns).toEqual(['columnA']);
  });
});
