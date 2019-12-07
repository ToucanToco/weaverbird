import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';
import { Pipeline } from '@/lib/steps';

import { setupMockStore, RootState } from './utils';


const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Filter Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('filter');
  });

  it('should get a specific class when there is more than one condition to filter-form container', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: {
        name: 'filter',
        condition: {
          and: [
            { column: 'foo', value: 'bar', operator: 'gt' },
            { column: 'yolo', value: 'carpe diem', operator: 'nin' },
          ],
        },
      },
    });
    expect(wrapper.classes()).toContain('filter-form--multiple-conditions');
  });

  describe('ListWidget', () => {
    it('should have exactly on ListWidget component', () => {
      const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should pass down the "condition" prop to the ListWidget value prop', async () => {
      const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'filter',
          condition: { and: [{ column: 'foo', value: 'bar', operator: 'gt' }] },
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', value: 'bar', operator: 'gt' },
      ]);
    });
  });

  it('should use selected column at creation', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }, { name: 'bar', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['bar'],
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('bar');
  });

  it('should have no default column if no selected column', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }, { name: 'bar', type: 'string' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('');
  });

  it('should not use selected column on edition', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }, { name: 'bar', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['bar'],
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
      propsData: {
        isStepCreation: false,
        initialStepValue: {
          name: 'filter',
          condition: {
            and: [{ column: 'foo', value: 'bar', operator: 'gt' }],
          },
        },
      },
    });
    // we're editing an existing step with column `foo`, therefore even if the
    // column `bar` is selected in the interface, the step column should remain
    // `foo`.
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('foo');
  });

  it('should report errors when submitted data is not valid', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    wrapper.setData({
      editedStep: {
        name: 'filter',
        condition: { and: [] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toContainEqual({ dataPath: '.condition.and', keyword: 'minItems' });
  });

  it('should validate and emit "formSaved" when submitting a valid condition', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
      propsData: {
        initialStepValue: {
          name: 'filter',
          condition: {
            and: [
              { column: 'foo', value: 'bar', operator: 'gt' },
              { column: 'foo', value: ['bar', 'toto'], operator: 'nin' },
            ],
          },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'foo', value: 'bar', operator: 'gt' },
                { column: 'foo', value: ['bar', 'toto'], operator: 'nin' },
              ],
            },
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
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    wrapper.setData({
      editedStep: {
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'gt', value: '10' },
            { column: 'columnA', operator: 'in', value: ['0', '42'] },
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'gt', value: 10 },
                { column: 'columnA', operator: 'in', value: [0, 42] },
              ],
            },
          },
        ],
      ],
    });
  });

  it('should convert input value to float when the column data type is float', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    wrapper.setData({
      editedStep: {
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'gt', value: '10.3' },
            { column: 'columnA', operator: 'in', value: ['0', '42.1'] },
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'gt', value: 10.3 },
                { column: 'columnA', operator: 'in', value: [0, 42.1] },
              ],
            },
          },
        ],
      ],
    });
  });

  it('should convert input value to boolean when the column data type is boolean', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'boolean' }],
        data: [[null]],
      },
    });
    const wrapper = mount(FilterStepForm, {
      store,
      localVue,
      sync: false,
    });
    wrapper.setData({
      editedStep: {
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnA', operator: 'in', value: ['True', 'False'] },
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'eq', value: true },
                { column: 'columnA', operator: 'in', value: [true, false] },
              ],
            },
          },
        ],
      ],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
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
    const wrapper = mount(FilterStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
