import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import AddTextColumnStepForm from '@/components/stepforms/AddTextColumnStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Add Text Column Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(AddTextColumnStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('text');
  });

  it('should have exactly 2 widgetinputtext component', () => {
    const wrapper = shallowMount(AddTextColumnStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputWrappers.length).toEqual(2);
  });

  it('should pass down properties', async () => {
    const wrapper = shallowMount(AddTextColumnStepForm, { store: emptyStore, localVue });
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', new_column: 'foo' } });
    await localVue.nextTick();
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(0)
        .props('value'),
    ).toEqual('some text');
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(1)
        .props('value'),
    ).toEqual('foo');
  });

  it('should make the focus on the column added after validation', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = mount(AddTextColumnStepForm, { store, localVue });
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', new_column: 'foo' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.vqb.selectedColumns).toEqual(['foo']);
  });

  it('should not change the column focus if validation fails', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(AddTextColumnStepForm, { store, localVue });
    wrapper.setData({
      editedStep: { name: 'text', text: '', new_column: 'columnB' },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(store.state.vqb.selectedColumns).toEqual(['columnA']);
  });
});
