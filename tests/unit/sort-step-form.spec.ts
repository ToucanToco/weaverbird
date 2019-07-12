import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import SortStepForm from '@/components/stepforms/SortStepForm.vue';
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

describe('Sort Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
  });

  context('WidgetList', () => {
    it('should have one widgetList component', () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue });
      const widgetListWrapper = wrapper.findAll('widgetlist-stub');
      expect(widgetListWrapper.length).to.equal(1);
    });

    it('should pass the defaultSortColumn props to widgetList', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue });
      await localVue.nextTick();
      expect(wrapper.find('widgetlist-stub').props().value).to.eql([{ column: '', order: 'asc' }]);
    });

    it('should pass right sort props to widgetList sort column', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('widgetlist-stub').props().value).to.eql([
        { column: 'amazing', order: 'desc' },
      ]);
    });
  });

  context('Validation', () => {
    it('should report errors when a column parameter is an empty string', async () => {
      const wrapper = mount(SortStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: '', order: 'desc' }],
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.columns[0].column' }]);
    });

    it('should validate and emit "formSaved" when submitted data is valid', async () => {
      const wrapper = mount(SortStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.errors).to.be.null;
      expect(wrapper.emitted()).to.eql({
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
    const wrapper = mount(SortStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
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
    const wrapper = mount(SortStepForm, {
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
