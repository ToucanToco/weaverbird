import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import AggregateStepForm from '@/components/stepforms/AggregateStepForm.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetMultiselect from '@/components/stepforms/WidgetMultiselect.vue';
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

describe('Aggregate Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
  });

  describe('WidgetMultiselect', () => {
    it('should have exactly one WidgetMultiselect component', () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue });
      const widgetWrappers = wrapper.findAll('widgetmultiselect-stub');
      expect(widgetWrappers.length).to.equal(1);
    });

    it('should instantiate an WidgetMultiselect widget with proper options from the store', () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = shallowMount(AggregateStepForm, { store, localVue });
      const widgetMultiselect = wrapper.find('widgetmultiselect-stub');
      expect(widgetMultiselect.attributes('options')).to.equal('columnA,columnB,columnC');
    });

    it('should pass down the "on" prop to the WidgetMultiselect value prop', async () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue });
      wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo', 'bar'], aggregations: [] } });
      await localVue.nextTick();
      expect(wrapper.find('widgetmultiselect-stub').props().value).to.eql(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const store = emptyStore;
      const wrapper = mount(AggregateStepForm, { store, localVue });
      wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } });
      await wrapper.find(WidgetMultiselect).trigger('input');
      expect(store.state.selectedColumns).to.eql(['foo']);
    });
  });

  describe('WidgetList', () => {
    it('should have exactly on WidgetList component', () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue });
      const widgetWrappers = wrapper.findAll('widgetlist-stub');
      expect(widgetWrappers.length).to.equal(1);
    });

    it('should pass down the "aggregations" prop to the WidgetList value prop', async () => {
      const wrapper = shallowMount(AggregateStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'aggregate',
          on: [],
          aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('widgetlist-stub').props().value).to.eql([
        { column: 'foo', newcolumn: 'bar', aggfunction: 'sum' },
      ]);
    });

    it('should have expected default aggregation parameters', () => {
      const wrapper = mount(AggregateStepForm, { store: emptyStore, localVue });
      const widgetWrappers = wrapper.findAll(WidgetAutocomplete);
      expect(widgetWrappers.at(0).props().value).to.equal('');
      expect(widgetWrappers.at(1).props().value).to.equal('sum');
    });
  });

  describe('Validation', () => {
    it('should report errors when the "on" parameter is an empty string', async () => {
      const wrapper = mount(AggregateStepForm, {
        store: emptyStore,
        localVue,
        data: () => {
          return {
            editedStep: {
              name: 'aggregate',
              on: [''],
              aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
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
      expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.on[0]' }]);
    });

    it('should report errors when the "column" parameter is an empty string', async () => {
      const wrapper = mount(AggregateStepForm, {
        store: emptyStore,
        localVue,
        data: () => {
          return {
            editedStep: {
              name: 'aggregate',
              on: ['foo'],
              aggregations: [{ column: '', newcolumn: 'bar', aggfunction: 'sum' }],
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
      expect(errors).to.eql([
        { keyword: 'minLength', dataPath: '.aggregations[0].column' },
        // newcolumn is computed based on column so an error is also returned for this parameter
        { keyword: 'minLength', dataPath: '.aggregations[0].newcolumn' },
      ]);
    });

    it('should report errors when the "aggfunction" parameter is not allowed', async () => {
      const wrapper = mount(AggregateStepForm, {
        store: emptyStore,
        localVue,
        data: () => {
          return {
            editedStep: {
              name: 'aggregate',
              on: ['foo'],
              aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: '' }],
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
      expect(errors).to.eql([{ keyword: 'enum', dataPath: '.aggregations[0].aggfunction' }]);
    });

    it('should keep the same column name as newcolumn if only one aggregation is performed', async () => {
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
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.errors).to.be.null;
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).to.equal('bar');
    });

    it('should set newcolumn cleverly if several aggregations are performed o, the same column', async () => {
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
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.errors).to.be.null;
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).to.equal('bar-sum');
      expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumn).to.equal('bar-avg');
    });

    it('should validate and emit "formSaved" when submitted data is valid', async () => {
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
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.errors).to.be.null;
      expect(wrapper.emitted()).to.eql({
        formSaved: [
          [
            {
              name: 'aggregate',
              on: ['foo'],
              aggregations: [{ column: 'bar', newcolumn: 'bar', aggfunction: 'sum' }],
            },
          ],
        ],
      });
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(AggregateStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });

  it('should change the column focus after input in multiselect', async () => {
    const store = setupStore({ selectedColumns: [] });
    const wrapper = mount(AggregateStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } });
    wrapper.find(WidgetMultiselect).trigger('input');
    await localVue.nextTick();
    expect(store.state.selectedColumns).to.eql(['foo']);
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
    const wrapper = mount(AggregateStepForm, {
      store,
      localVue,
      propsData: { isStepCreation: true },
    });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
