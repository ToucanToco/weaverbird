import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget ReplaceWidget', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ReplaceWidget, { store: emptyStore, localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two InputTextWidget components', () => {
    const wrapper = shallowMount(ReplaceWidget, { store: emptyStore, localVue, sync: false });
    const widgetWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should pass down the properties to the input components', () => {
    const wrapper = shallowMount(ReplaceWidget, {
      store: emptyStore,
      localVue,
      sync: false,
      propsData: {
        value: ['foo', 'bar'],
      },
    });
    const widgetWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
    expect(widgetWrappers.at(1).props().value).toEqual('bar');
  });

  it('should emit "input" event with correct updated values when input valueToReplace is updated', async () => {
    const wrapper = shallowMount(ReplaceWidget, {
      propsData: {
        value: ['yolo', 'bim'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });
    await localVue.nextTick();
    wrapper
      .findAll('InputTextWidget-stub')
      .at(0)
      .vm.$emit('input', 'foo');
    expect(wrapper.emitted().input[1][0]).toEqual(['foo', 'bim']);
  });

  it('should emit "input" event with correct updated values when input newValueToReplace is updated', async () => {
    const wrapper = shallowMount(ReplaceWidget, {
      propsData: {
        value: ['yolo', 'bim'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });
    await localVue.nextTick();
    wrapper
      .findAll('InputTextWidget-stub')
      .at(1)
      .vm.$emit('input', 'bar');
    expect(wrapper.emitted().input[1][0]).toEqual(['yolo', 'bar']);
  });
});
