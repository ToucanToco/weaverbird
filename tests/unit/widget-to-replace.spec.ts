import { shallowMount, createLocalVue } from '@vue/test-utils';
import WidgetToReplace from '@/components/stepforms/WidgetToReplace.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget WidgetToReplace', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetToReplace, { store: emptyStore, localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two WidgetInputText components', () => {
    const wrapper = shallowMount(WidgetToReplace, { store: emptyStore, localVue, sync: false });
    const widgetWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should pass down the properties to the input components', () => {
    const wrapper = shallowMount(WidgetToReplace, {
      store: emptyStore,
      localVue,
      sync: false,
      data: () => {
        return { toReplace: ['foo', 'bar'] };
      },
    });
    const widgetWrappers = wrapper.findAll('widgetinputtext-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
    expect(widgetWrappers.at(1).props().value).toEqual('bar');
  });

  it('should emit "input" event on "toReplace" update', async () => {
    const wrapper = shallowMount(WidgetToReplace, {
      store: emptyStore,
      localVue,
      sync: false,
    });
    wrapper.setData({ toReplace: ['foo', 'bar'] });
    await localVue.nextTick();
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([['foo', 'bar']]);
  });
});
