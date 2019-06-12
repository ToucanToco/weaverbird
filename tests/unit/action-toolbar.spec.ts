import { expect } from 'chai';
import Vue from 'vue';
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
    expect(actionButtons.exists()).to.be.true;
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
    expect(button.props('isActive')).to.be.false;
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
    expect(button.props('isActive')).to.be.false;
    button.trigger('click');
    await Vue.nextTick();
    expect(button.props('isActive')).to.be.true;
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
    await Vue.nextTick();
    expect(button1.props('isActive')).to.be.true;
    button2.trigger('click');
    await Vue.nextTick();
    expect(button1.props('isActive')).to.be.false;
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
    expect(wrapper.emitted().actionClicked).not.to.exist;
    buttons.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).to.eql([
      { name: 'aggregate', on: [], aggregations: [] },
    ]);
  });
});
