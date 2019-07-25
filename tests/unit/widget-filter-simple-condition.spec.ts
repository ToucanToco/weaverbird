import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import WidgetFilterSimpleCondition from '@/components/stepforms/WidgetFilterSimpleCondition.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetMultiInputText from '@/components/stepforms/WidgetMultiInputText.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget WidgetAggregation', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(autocompleteWrappers.length).to.equal(2);
    const inputtextWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(inputtextWrappers.length).to.equal(1);
  });

  it('should have exactly have a WidgetMultiInputText if operator is "in" or "nin"', async () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: [], operator: 'in' } });
    await localVue.nextTick();
    const autocompleteWrappers = wrapper.findAll('widgetmultiinputtext-stub');
    expect(autocompleteWrappers.length).to.equal(1);
  });

  it('should instantiate a widgetAutocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store, localVue });
    const widgetWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(widgetWrappers.at(0).attributes('options')).to.equal('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first WidgetAutocomplete value prop', async () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: '', operator: 'eq' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(widgetWrappers.at(0).props().value).to.equal('foo');
  });

  it('should pass down the "operator" prop to the second WidgetAutocomplete value prop', async () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: '', operator: 'nin' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(widgetWrappers.at(1).props().value).to.eql({
      operator: 'nin',
      label: 'not be among',
      inputWidget: WidgetMultiInputText,
    });
  });

  it('should change the type of value accordingly when switching the "operator"', async () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, { store: emptyStore, localVue });
    expect((wrapper.vm.$data.editedValue.value = ''));
    wrapper.setData({ editedValue: { column: 'foo', value: '', operator: 'in' } });
    const operatorWrapper = wrapper.findAll('widgetautocomplete-stub').at(1);
    await operatorWrapper.trigger('input', { value: 'be among' });
    expect((wrapper.vm.$data.editedValue.value = []));
  });

  it('should emit "input" event on "editedValue" update', async () => {
    const wrapper = shallowMount(WidgetFilterSimpleCondition, {
      store: emptyStore,
      localVue,
    });
    wrapper.setData({ editedValue: { column: 'foo', value: 'bar', operator: 'gt' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).to.exist;
    expect(wrapper.emitted().input[0]).to.eql([{ column: 'foo', value: 'bar', operator: 'gt' }]);
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(WidgetFilterSimpleCondition, {
      propsData: {
        value: { column: 'columnA', value: 'bar', operator: 'eq' },
      },
      store,
      localVue,
    });
    wrapper.setData({ editedValue: { column: 'columnB', value: 'bar', operator: 'eq' } });
    await wrapper.find(WidgetAutocomplete).trigger('input');
    expect(store.state.selectedColumns).to.eql(['columnB']);
  });
});
