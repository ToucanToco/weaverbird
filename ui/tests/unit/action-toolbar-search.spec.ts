import type { Wrapper } from '@vue/test-utils';
import { createLocalVue, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Multiselect } from 'vue-multiselect';

import ActionToolbarSearch from '@/components/ActionToolbarSearch.vue';
import type { ActionCategories } from '@/components/constants';
import Popover from '@/components/Popover.vue';

import { setupMockStore } from './utils';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

vi.mock('@/components/FAIcon.vue');

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

describe('ActionToolbarSearch', () => {
  let wrapper: Wrapper<ActionToolbarSearch>;

  describe('not active', () => {
    beforeEach(() => {
      wrapper = mount(ActionToolbarSearch, {
        localVue,
        pinia,
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
      setupMockStore({ translator: 'mongo36' });
      wrapper = mount(ActionToolbarSearch, {
        propsData: { isActive: true },
        localVue,
        pinia,
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
          .flatMap((e: ActionCategories) => e.actions.map((e) => e.name)),
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
        pinia,
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
