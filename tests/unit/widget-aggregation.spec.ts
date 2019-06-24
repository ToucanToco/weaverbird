import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import WidgetAggregation from '@/components/stepforms/WidgetAggregation.vue';
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
    const wrapper = shallowMount(WidgetAggregation, { store: emptyStore, localVue });
    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly two WidgetAutocomplete components', () => {
    const wrapper = shallowMount(WidgetAggregation, { store: emptyStore, localVue });
    const widgetWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(widgetWrappers.length).to.eql(2);
  });

  it('should instantiate an widgetAutocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(WidgetAggregation, { store, localVue });
    const widgetWrappers = wrapper.findAll('widgetautocomplete-stub');
    expect(widgetWrappers.at(0).attributes('options')).to.equal('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first WidgetAutocomplete value prop', async () => {
    const wrapper = shallowMount(WidgetAggregation, { store: emptyStore, localVue });
    wrapper.setProps({ value: { column: 'foo', newcolumn: '', aggfunction: 'sum' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('WidgetAutocomplete-stub');
    expect(widgetWrappers.at(0).props().value).to.eql('foo');
  });

  it('should pass down the "aggfunction" prop to the second WidgetAutocomplete value prop', async () => {
    const wrapper = shallowMount(WidgetAggregation, { store: emptyStore, localVue });
    wrapper.setProps({ value: { column: 'foo', newcolumn: '', aggfunction: 'avg' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('WidgetAutocomplete-stub');
    expect(widgetWrappers.at(1).props().value).to.eql('avg');
  });

  it('should emit "input" event on "value" update', async () => {
    const wrapper = shallowMount(WidgetAggregation, {
      store: emptyStore,
      localVue,
    });
    wrapper.setProps({ value: { column: 'bar', newcolumn: '', aggfunction: 'avg' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).to.exist;
    expect(wrapper.emitted().input[0]).to.eql([
      { column: 'bar', newcolumn: '', aggfunction: 'avg' },
    ]);
  });
});
