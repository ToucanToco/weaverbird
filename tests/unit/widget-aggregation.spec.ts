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

  it('should pass down the "column" prop to the first WidgetAutocomplete value prop', () => {
    const wrapper = shallowMount(WidgetAggregation, {
      store: emptyStore,
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'sum' } },
    });
    const widgetWrappers = wrapper.findAll('WidgetAutocomplete-stub');
    expect(widgetWrappers.at(0).props().value).to.eql('foo');
  });

  it('should pass down the "aggfunction" prop to the second WidgetAutocomplete value prop', () => {
    const wrapper = shallowMount(WidgetAggregation, {
      store: emptyStore,
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'avg' } },
    });
    const widgetWrappers = wrapper.findAll('WidgetAutocomplete-stub');
    expect(widgetWrappers.at(1).props().value).to.eql('avg');
  });

  it('should emit "input" event on "aggregation" update', async () => {
    const wrapper = shallowMount(WidgetAggregation, {
      store: emptyStore,
      localVue,
    });
    wrapper.setData({ aggregation: { column: 'bar', newcolumn: '', aggfunction: 'avg' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).to.exist;
    expect(wrapper.emitted().input[0]).to.eql([
      { column: 'bar', newcolumn: '', aggfunction: 'avg' },
    ]);
  });
});
