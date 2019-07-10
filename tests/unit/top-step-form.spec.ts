import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import TopStepForm from '@/components/stepforms/TopStepForm.vue';
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

describe('Top Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(TopStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('top');
  });

  it('should have exactly 4 input components', () => {
    const wrapper = shallowMount(TopStepForm, { store: emptyStore, localVue });
    expect(wrapper.find('#limitInput').exists()).to.be.true;
    expect(wrapper.find('#rankOnInput').exists()).to.be.true;
    expect(wrapper.find('#sortOrderInput').exists()).to.be.true;
    expect(wrapper.find('#groupbyColumnsInput').exists()).to.be.true;
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(TopStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'top', rank_on: 'foo', sort: 'asc', limit: 10, groups: ['test'] },
    });
    await localVue.nextTick();
    expect(wrapper.find('#limitInput').props('value')).to.equal(10);
    expect(wrapper.find('#sortOrderInput').props('value')).to.equal('asc');
    expect(wrapper.find('#groupbyColumnsInput').props('value')).to.eql(['test']);
  });

  it('should report errors when column is empty', async () => {
    const wrapper = mount(TopStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).to.eql([
      { keyword: 'required', dataPath: '' },
      { keyword: 'minLength', dataPath: '.rank_on' },
    ]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(TopStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'top', rank_on: 'foo', sort: 'asc', limit: 10, groups: ['test'] },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'top', rank_on: 'foo', sort: 'asc', limit: 10, groups: ['test'] }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(TopStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'top', rank_on: 'foo', sort: 'asc', limit: 10 },
      { name: 'top', rank_on: 'bar', sort: 'asc', limit: 5 },
      { name: 'top', rank_on: 'tic', sort: 'desc', limit: 1 },
    ];
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(TopStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
