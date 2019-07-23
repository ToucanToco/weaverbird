import { shallowMount, createLocalVue } from '@vue/test-utils';
import ActionToolbar from '@/components/ActionToolbar.vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ActionToolbar', () => {
  it('should instantiate action toolbar button', () => {
    const wrapper = shallowMount(ActionToolbar, {
      propsData: {
        buttons: [
          {
            category: 'filter',
            icon: 'filter',
            label: 'Filter',
          },
        ],
      },
    });
    const actionButtons = wrapper.findAll('action-toolbar-button-stub');
    expect(actionButtons.exists()).toBeTruthy();
  });

  it('should instantiate with its hidden popover', () => {
    const wrapper = shallowMount(ActionToolbar, {
      propsData: {
        buttons: [
          {
            category: 'filter',
            icon: 'filter',
            label: 'Filter',
          },
        ],
      },
    });
    const actionButtons = wrapper.findAll('action-toolbar-button-stub');
    const button = actionButtons.at(0);
    expect(button.props('isActive')).toBeFalsy();
  });

  it('should open a popover on action toolbar click', async () => {
    const wrapper = shallowMount(ActionToolbar, {
      propsData: {
        buttons: [
          {
            category: 'filter',
            icon: 'filter',
            label: 'Filter',
          },
        ],
      },
    });
    const actionButtons = wrapper.findAll('action-toolbar-button-stub');
    const button = actionButtons.at(0);
    expect(button.props('isActive')).toBeFalsy();
    button.trigger('click');
    await localVue.nextTick();
    expect(button.props('isActive')).toBeTruthy();
  });

  it('should close the current popover when an other button is clicked', async () => {
    const wrapper = shallowMount(ActionToolbar, {
      propsData: {
        buttons: [
          {
            category: 'filter',
            icon: 'filter',
            label: 'Filter',
          },
          {
            category: 'compute',
            icon: 'compute',
            label: 'Compute',
          },
        ],
      },
    });
    const actionButtons = wrapper.findAll('action-toolbar-button-stub');
    const button1 = actionButtons.at(0);
    const button2 = actionButtons.at(1);
    button1.trigger('click');
    await localVue.nextTick();
    expect(button1.props('isActive')).toBeTruthy();
    button2.trigger('click');
    await localVue.nextTick();
    expect(button1.props('isActive')).toBeFalsy();
  });

  it('should emit an actionClicked event only on an aggregate button', () => {
    const store = setupStore();
    const wrapper = shallowMount(ActionToolbar, {
      store,
      localVue,
      propsData: {
        buttons: [{ label: 'Filter' }, { label: 'Aggregate' }],
      },
    });
    const buttons = wrapper.findAll('action-toolbar-button-stub');
    buttons.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked).toBeUndefined();
    buttons.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['aggregate']);
  });

  it('should instantiate the search bar', () => {
    const wrapper = shallowMount(ActionToolbar, {
      propsData: {
        buttons: [
          {
            category: 'filter',
            icon: 'filter',
            label: 'Filter',
          },
        ],
      },
    });
    const searchBar = wrapper.findAll('search-bar-stub');
    expect(searchBar.exists()).toBeTruthy();
  });
});
