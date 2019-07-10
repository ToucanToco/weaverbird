import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import PercentageStepForm from '@/components/stepforms/PercentageStepForm.vue';
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

describe('Percentage Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('percentage');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('columnpicker-stub');
    const multiselectWrappers = wrapper.findAll('widgetmultiselect-stub');
    const textInputWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(autocompleteWrappers.length).to.equal(1);
    expect(multiselectWrappers.length).to.equal(1);
    expect(textInputWrappers.length).to.equal(1);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(PercentageStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'percentage', column: 'foo', group: ['test'], new_column: 'bar' },
    });
    await localVue.nextTick();
    expect(wrapper.find('widgetmultiselect-stub').props('value')).to.eql(['test']);
    expect(wrapper.find('widgetinputtext-stub').props('value')).to.equal('bar');
  });

  describe('Errors', () => {
    it('should report errors when column is empty', async () => {
      const wrapper = mount(PercentageStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.column' }]);
    });

    it('should report errors when newn_column is an already existing column name', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(PercentageStepForm, { store, localVue });
      wrapper.setData({
        editedStep: { name: 'percentage', column: 'columnA', new_column: 'columnB' },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
      }));
      expect(errors).to.eql([{ keyword: 'columnNameAlreadyUsed', dataPath: '.new_column' }]);
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(PercentageStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'percentage', column: 'foo', group: ['test'], new_column: 'bar' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'percentage', column: 'foo', group: ['test'], new_column: 'bar' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(PercentageStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'percentage', column: 'foo' },
      { name: 'percentage', column: 'baz' },
      { name: 'percentage', column: 'tic' },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(PercentageStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
