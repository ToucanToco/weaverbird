import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';
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

describe('Filter Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.stepname).equal('filter');
  });

  it('should have exactly one WidgetFilterSimplecondition component', () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    const connditionWrappers = wrapper.findAll('widgetfiltersimplecondition-stub');
    expect(connditionWrappers.length).to.equal(1);
  });

  it('should pass down a valid prop to WidgetFilterSimplecondition', async () => {
    const wrapper = shallowMount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { condition: { column: '', value: 'foo', operator: 'nin' } } });
    await localVue.nextTick();
    expect(wrapper.find('widgetfiltersimplecondition-stub').props('value')).to.eql({
      column: '',
      value: 'foo',
      operator: 'nin',
    });
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).to.deep.include.members([{ dataPath: '.condition', keyword: 'oneOf' }]);
  });

  it('should validate and emit "formSaved" when submitting a valid condition', () => {
    const wrapper = mount(FilterStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'filter',
          condition: { column: 'foo', value: 'bar', operator: 'gt' },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'filter', condition: { column: 'foo', value: 'bar', operator: 'gt' } }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
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
    const wrapper = mount(FilterStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).to.equal(3);
  });
});
