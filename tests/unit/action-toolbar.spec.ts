import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import ActionToolbar from '@/components/ActionToolbar.vue';
import ActionToolbarButton from '@/components/ActionToolbarButton.vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Action Toolbar', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ActionToolbar);
    expect(wrapper.exists()).to.be.true;
  });

  it('should istantiate an aggregate button', () => {
    const wrapper = mount(ActionToolbar, {
      propsData: {
        buttons: [{ label: 'Aggregate' }],
      },
    });
    const buttons = wrapper.find(ActionToolbarButton);
    expect(buttons.exists()).to.be.true;
    expect(buttons.props().label).to.eql('Aggregate');
  });

  it('should emit an actionClicked event only on an aggregate button', () => {
    const store = setupStore();
    const wrapper = mount(ActionToolbar, {
      store,
      localVue,
      propsData: {
        buttons: [{ label: 'Filter' }, { label: 'Aggregate' }],
      },
    });
    const buttons = wrapper.findAll(ActionToolbarButton);
    buttons.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked).not.to.exist;
    buttons.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).to.eql([
      { name: 'aggregate', on: [], aggregations: [] },
    ]);
  });
});
