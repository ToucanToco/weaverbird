import { shallowMount, createLocalVue } from '@vue/test-utils';
import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget ReplaceWidget', () => {
  let emptyStore: Store<any>;
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
      data: () => {
        return { toReplace: ['foo', 'bar'] };
      },
    });
    const widgetWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
    expect(widgetWrappers.at(1).props().value).toEqual('bar');
  });

  it('should emit "input" event on "toReplace" update', async () => {
    const wrapper = shallowMount(ReplaceWidget, {
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
