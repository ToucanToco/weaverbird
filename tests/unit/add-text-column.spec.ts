import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AddTextColumnStepForm from '@/components/stepforms/AddTextColumnStepForm.vue';

import { setupMockStore, RootState, BasicStepFormTestRunner } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);


describe('Add Text Column Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  const runner = new BasicStepFormTestRunner(AddTextColumnStepForm, 'text', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 2,
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

  describe('Warning', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      });
      const wrapper = shallowMount(AddTextColumnStepForm, { store, localVue });
      wrapper.setData({ editedStep: { text: '', new_column: 'columnA' } });
      await localVue.nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if new_column is not an already existing column name', async () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      });
      const wrapper = shallowMount(AddTextColumnStepForm, { store, localVue });
      wrapper.setData({ editedStep: { text: '', new_column: 'columnB' } });
      await localVue.nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toBeNull();
    });
  });
});
