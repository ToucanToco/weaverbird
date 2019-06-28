import { expect } from 'chai';
import { mount, createLocalVue, shallowMount } from '@vue/test-utils';
import ActionMenu from '@/components/ActionMenu.vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Action Menu', () => {
  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(ActionMenu);

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.classes()).not.to.contain('popover--active');
  });

  it('should instantiate with the popover active', () => {
    const wrapper = mount(ActionMenu, {
      propsData: {
        isActive: true,
      },
    });

    expect(wrapper.classes()).to.contain('popover--active');
  });

  it('should have an "Rename column" action', () => {
    const wrapper = shallowMount(ActionMenu);
    expect(wrapper.html()).to.contain('Rename column');
  });

  it('should have an "Fill null values" action', () => {
    const wrapper = shallowMount(ActionMenu);
    expect(wrapper.html()).to.contain('Fill null values');
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

      expect(wrapper.emitted().actionClicked).not.to.be.empty;
      expect(wrapper.emitted().actionClicked[0]).to.eql(['duplicate']);
    });

    it('should emit a close event', () => {
      const store = setupStore();
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(0).trigger('click');

      expect(wrapper.emitted().closed).to.exist;
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

      expect(wrapper.emitted().actionClicked).not.to.be.empty;
      expect(wrapper.emitted().actionClicked[0]).to.eql(['rename']);
    });

    it('should emit a close event', () => {
      const wrapper = shallowMount(ActionMenu);
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().closed).to.exist;
    });
  });

  describe('when clicking on "Delete column"', () => {
    it('should add a valide delete step in the pipeline', async () => {
      const store = setupStore();
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
      expect(store.state.pipeline).to.eql([{ name: 'delete', columns: ['columnA'] }]);
    });

    it('should emit a close event', () => {
      const store = setupStore();
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(2).trigger('click');

      expect(wrapper.emitted().closed).to.exist;
    });

    it('should close any open step form to show the addition of the delete step in the pipeline', () => {
      const store = setupStore({ isEditingStep: true });
      const wrapper = shallowMount(ActionMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(2).trigger('click');
      expect(store.state.isEditingStep).to.be.false;
    });
  });

  describe('when clicking on "Fill null values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = shallowMount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(3).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).to.eql(['fillna']);
    });
  });

  it('should emit a close event', () => {
    const wrapper = shallowMount(ActionMenu);
    const actionsWrapper = wrapper.findAll('.action-menu__option');
    actionsWrapper.at(3).trigger('click');

    expect(wrapper.emitted().closed).to.exist;
  });
});
