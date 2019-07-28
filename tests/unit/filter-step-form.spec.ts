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
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('filter');
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

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(FilterStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toContainEqual({ dataPath: '.condition', keyword: 'oneOf' });
  });

  it('should validate and emit "formSaved" when submitting a valid condition', () => {
    const wrapper = mount(FilterStepForm, {
      store: emptyStore,
      localVue,
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
    const store = setupStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(FilterStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(store.state.selectedStepIndex).toEqual(3);
  });
});
