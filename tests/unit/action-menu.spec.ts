import { mount, createLocalVue, shallowMount } from '@vue/test-utils';
import ActionMenu from '@/components/ActionMenu.vue';
import Vuex from 'vuex';
import { VQBnamespace } from '@/store';
import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Action Menu', () => {
  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(ActionMenu);

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).not.toContain('popover--active');
  });

  it('should instantiate with the popover active', () => {
    const wrapper = mount(ActionMenu, {
      propsData: {
        isActive: true,
      },
    });

    expect(wrapper.classes()).toContain('popover--active');
  });

  it('should have an "Rename column" action', () => {
    const wrapper = shallowMount(ActionMenu);
    expect(wrapper.html()).toContain('Rename column');
  });

  it('should have an "Fill null values" action', () => {
    const wrapper = shallowMount(ActionMenu);
    expect(wrapper.html()).toContain('Fill null values');
  });

  describe('when clicking on "Duplicate column"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(0).trigger('click');

      expect(wrapper.emitted().actionClicked.length).toBeGreaterThan(0);
      expect(wrapper.emitted().actionClicked[0]).toEqual(['duplicate']);
    });

    it('should emit a close event', () => {
      const store = setupMockStore();
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(0).trigger('click');

      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when clicking on "Rename column"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().actionClicked.length).toBeGreaterThan(0);
      expect(wrapper.emitted().actionClicked[0]).toEqual(['rename']);
    });

    it('should emit a close event', () => {
      const wrapper = shallowMount(ActionMenu);
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when clicking on "Delete column"', () => {
    it('should add a valide delete step in the pipeline', async () => {
      const store = setupMockStore();
      const wrapper = shallowMount(ActionMenu, {
        store,
        localVue,
        propsData: {
          columnName: 'columnA',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(2).trigger('click');
      await localVue.nextTick();
      expect(store.state.vqb.pipeline).toEqual([{ name: 'delete', columns: ['columnA'] }]);
    });

    it('should emit a close event', () => {
      const store = setupMockStore();
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(2).trigger('click');

      expect(wrapper.emitted().closed).toBeTruthy();
    });

    it('should close any open step form to show the addition of the delete step in the pipeline', () => {
      const store = setupMockStore({ currentStepFormName: 'fillna' });
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(2).trigger('click');
      expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
    });
  });

  describe('when clicking on "Filter values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(3).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).toEqual(['filter']);
    });
  });

  it('should emit a close event', () => {
    const wrapper = shallowMount(ActionMenu);
    const actionsWrapper = wrapper.findAll('.action-menu__option');
    actionsWrapper.at(3).trigger('click');

    expect(wrapper.emitted().closed).toBeTruthy();
  });

  describe('when clicking on "Fill null values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(4).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).toEqual(['fillna']);
    });
  });

  it('should emit a close event', () => {
    const wrapper = shallowMount(ActionMenu);
    const actionsWrapper = wrapper.findAll('.action-menu__option');
    actionsWrapper.at(4).trigger('click');

    expect(wrapper.emitted().closed).toBeTruthy();
  });

  describe('when clicking on "Replace values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(5).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).toEqual(['replace']);
    });
  });

  it('should emit a close event', () => {
    const wrapper = shallowMount(ActionMenu);
    const actionsWrapper = wrapper.findAll('.action-menu__option');
    actionsWrapper.at(5).trigger('click');

    expect(wrapper.emitted().closed).toBeTruthy();
  });

  describe('when clicking on "Sort values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(6).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).toEqual(['sort']);
    });
  });

  it('should emit a close event', () => {
    const wrapper = shallowMount(ActionMenu);
    const actionsWrapper = wrapper.findAll('.action-menu__option');
    actionsWrapper.at(6).trigger('click');

    expect(wrapper.emitted().closed).toBeTruthy();
  });
});
