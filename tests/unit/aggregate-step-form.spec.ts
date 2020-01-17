import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AggregateStepForm from '@/components/stepforms/AggregateStepForm.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { setupMockStore, BasicStepFormTestRunner, RootState } from './utils';
import { Pipeline } from '@/lib/steps';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Aggregate Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore();
  });

  const runner = new BasicStepFormTestRunner(AggregateStepForm, 'aggregate', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });

  describe('MultiselectWidget', () => {

    it('should instantiate an MultiselectWidget widget with proper options from the store', () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = shallowMount(AggregateStepForm, { store, localVue, sync: false });
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue, sync: false });
      wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo', 'bar'], aggregations: [] } });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const store = emptyStore;
      const wrapper = mount(AggregateStepForm, { store, localVue, sync: false });
      wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } });
      wrapper.find(MultiselectWidget);
      await wrapper.vm.$nextTick();
      expect(store.state.vqb.selectedColumns).toEqual(['foo']);
    });
  });

  describe('ListWidget', () => {
    it('should have exactly on ListWidget component', () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue, sync: false });
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should pass down the "aggregations" prop to the ListWidget value prop', async () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue, sync: false });
      wrapper.setData({
        editedStep: {
          name: 'aggregate',
          on: [],
          aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', newcolumn: 'bar', aggfunction: 'sum' },
      ]);
    });

    it('should have expected default aggregation parameters', () => {
      const wrapper = mount(AggregateStepForm, { store: emptyStore, localVue, sync: false });
      const widgetWrappers = wrapper.findAll(AutocompleteWidget);
      expect(widgetWrappers.at(0).props().value).toEqual('');
      expect(widgetWrappers.at(1).props().value).toEqual('sum');
    });
  });

  describe('Validation', () => {

    runner.testValidationErrors([
      {
        testlabel: '"on" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: [''],
            aggregations: [
              {
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
              }
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.on[0]' }
        ],
      },
      {
        testlabel: '"column" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['column1'],
            aggregations: [
              {
                newcolumn: '',
                aggfunction: 'sum',
                column: '',
              }
            ]
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.aggregations[0].column' },
          // newcolumn is computed based on column so an error is also returned for this parameter
          { keyword: 'minLength', dataPath: '.aggregations[0].newcolumn' },
        ],
      },
      {
        testlabel: '"aggfunction" unknown',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['column1'],
            aggregations: [
              {
                newcolumn: 'foo_col1',
                aggfunction: 'foo',
                column: 'col1',
              }
            ]
          },
        },
        errors: [
          { keyword: 'enum', dataPath: '.aggregations[0].aggfunction' },
        ],
      },
    ]);

    runner.testValidate(
      {
        testlabel: 'submitted data is valid',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['foo'],
            aggregations: [{ column: 'bar', newcolumn: 'bar', aggfunction: 'sum' }],
          },
        },
      }
    );

    it('should keep the same column name as newcolumn if only one aggregation is performed', () => {
      const wrapper = mount(AggregateStepForm, {
        store: emptyStore,
        localVue,
        data: () => {
          return {
            editedStep: {
              name: 'aggregate',
              on: ['foo'],
              aggregations: [{ column: 'bar', newcolumn: '', aggfunction: 'sum' }],
            },
          };
        },
        sync: false,
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).toEqual('bar');
    });

    it('should set newcolumn cleverly if several aggregations are performed o, the same column', () => {
      const wrapper = mount(AggregateStepForm, {
        store: emptyStore,
        localVue,
        data: () => {
          return {
            editedStep: {
              name: 'aggregate',
              on: ['foo'],
              aggregations: [
                { column: 'bar', newcolumn: '', aggfunction: 'sum' },
                { column: 'bar', newcolumn: '', aggfunction: 'avg' },
              ],
            },
          };
        },
        sync: false,
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).toEqual('bar-sum');
      expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumn).toEqual('bar-avg');
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(AggregateStepForm, { store: emptyStore, localVue, sync: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should change the column focus after input in multiselect', async () => {
    const store = setupMockStore({ selectedColumns: [] });
    const wrapper = mount(AggregateStepForm, { store, localVue, sync: false });
    wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(store.state.vqb.selectedColumns).toEqual(['foo']);
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', async () => {
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
    const wrapper = mount(AggregateStepForm, {
      store,
      localVue,
      propsData: { isStepCreation: true },
      sync: false,
    });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    await wrapper.vm.$nextTick();
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
