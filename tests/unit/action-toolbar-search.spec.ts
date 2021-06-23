import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Vuex from 'vuex';

import ActionToolbarSearch from '@/components/ActionToolbarSearch.vue';
import Popover from '@/components/Popover.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ActionToolbarSearch', () => {
  let wrapper: Wrapper<ActionToolbarSearch>;

  describe('not active', () => {
    beforeEach(() => {
      wrapper = mount(ActionToolbarSearch, {
        localVue,
        store: setupMockStore(),
      });
    });

    it('should have a button', () => {
      expect(wrapper.find('button').exists()).toBeTruthy();
    });

    it('should have a hidden popover', () => {
      expect(wrapper.find(Popover).vm.$props.visible).toBeFalsy();
    });
  });

  describe('active', () => {
    beforeEach(() => {
      wrapper = mount(ActionToolbarSearch, {
        propsData: { isActive: true },
        localVue,
        store: setupMockStore(),
      });
    });

    it('should have a visible popover', () => {
      expect(wrapper.find(Popover).vm.$props.visible).toBeTruthy();
    });
  });
});
