import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Multiselect from 'vue-multiselect';
import Vuex from 'vuex';

import ActionToolbarSearch from '@/components/ActionToolbarSearch.vue';
import { ActionCategories } from '@/components/constants';
import Popover from '@/components/Popover.vue';

import { setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

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
        store: setupMockStore({ translator: 'mongo36' }),
      });
    });

    it('should have a visible popover', () => {
      expect(wrapper.find(Popover).vm.$props.visible).toBeTruthy();
    });

    it('should have a opened multiselect', () => {
      expect(wrapper.find(Multiselect).isVisible()).toBeTruthy();
      expect(wrapper.find(Multiselect).vm.$data.isOpen).toBeTruthy();
    });

    it('should have a multiselect with option supported by the current translator', () => {
      const multiselectOptions = new Set(
        wrapper
          .find(Multiselect)
          .props('options')
          .flatMap((e: ActionCategories) => e.actions.map(e => e.name)),
      );
      expect(multiselectOptions.size > 0).toBeTruthy();
      expect(multiselectOptions).not.toContain('cast');
    });

    it('should emit "actionClicked" & "closed" when an option multiselect is clicked', () => {
      const multiselectOption = wrapper.findAll('.multiselect__option');
      multiselectOption.at(1).trigger('click');
      expect(wrapper.emitted().actionClicked[0]).toEqual(['text']);
      expect(wrapper.emitted().closed[0]).toBeDefined();
    });
  });

  describe('when switching from inactive to active', () => {
    beforeEach(async () => {
      wrapper = mount(ActionToolbarSearch, {
        propsData: { isActive: false },
        localVue,
        store: setupMockStore(),
      });
      await wrapper.vm.$nextTick();
      wrapper.setProps({ isActive: true });
      await wrapper.vm.$nextTick();
    });

    it('should have a visible popover', () => {
      expect(wrapper.find(Popover).vm.$props.visible).toBeTruthy();
    });

    it('should have a opened multiselect', () => {
      expect(wrapper.find(Multiselect).isVisible()).toBeTruthy();
      expect(wrapper.find(Multiselect).vm.$data.isOpen).toBeTruthy();
    });
  });
});
