import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import SortStepForm from '@/components/stepforms/SortStepForm.vue';
import { setupMockStore, RootState, ValidationError } from './utils';
import { Pipeline } from '@/lib/steps';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Sort Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
  });

  describe('ListWidget', () => {
    it('should have one widgetList component', () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
      const widgetListWrapper = wrapper.findAll('listwidget-stub');
      expect(widgetListWrapper.length).toEqual(1);
    });

    it('should pass the defaultSortColumn props to widgetList', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([{ column: '', order: 'asc' }]);
    });

    it('should pass right sort props to widgetList sort column', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'amazing', order: 'desc' },
      ]);
    });
  });

  describe('Validation', () => {
    it('should report errors when a column parameter is an empty string', () => {
      const wrapper = mount(SortStepForm, {
        store: emptyStore,
        localVue,
        sync: false,
      });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: '', order: 'desc' }],
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      // await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.columns[0].column' }]);
    });

    it('should validate and emit "formSaved" when submitted data is valid', async () => {
      const wrapper = mount(SortStepForm, { store: emptyStore, localVue, sync: false });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.emitted()).toEqual({
        formSaved: [
          [
            {
              name: 'sort',
              columns: [{ column: 'amazing', order: 'desc' }],
            },
          ],
        ],
      });
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(SortStepForm, { store: emptyStore, localVue, sync: false });
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
    const wrapper = mount(SortStepForm, {
      store,
      localVue,
      propsData: { isStepCreation: true },
      sync: false,
    });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
