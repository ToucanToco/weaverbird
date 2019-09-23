import { mount, createLocalVue } from '@vue/test-utils';
import ActionToolbarButton from '@/components/ActionToolbarButton.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('ActionToolbar', () => {
  it('should instantiate a Filter button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'filter' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(6);
    actionsWrappers.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['delete']);
    actionsWrappers.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[1]).toEqual(['select']);
    actionsWrappers.at(2).trigger('click');
    expect(wrapper.emitted().actionClicked[2]).toEqual(['filter']);
    actionsWrappers.at(3).trigger('click');
    expect(wrapper.emitted().actionClicked[3]).toEqual(['top']);
    actionsWrappers.at(4).trigger('click');
    expect(wrapper.emitted().actionClicked[4]).toEqual(['argmax']);
    actionsWrappers.at(5).trigger('click');
    expect(wrapper.emitted().actionClicked[5]).toEqual(['argmin']);
  });

  it('should instantiate a Compute button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'compute' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(2);
    actionsWrappers.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['formula']);
    actionsWrappers.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[1]).toEqual(['percentage']);
  });

  it('should instantiate a Compute button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'text' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(2);
    actionsWrappers.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['lowercase']);
    actionsWrappers.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[1]).toEqual(['uppercase']);
  });

  it('should instantiate a Date button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'date' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(0);
  });

  it('should instantiate an Aggregate button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'aggregate' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(0);
  });

  it('should instantiate a Reshape button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'reshape' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(2);
    actionsWrappers.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['pivot']);
    actionsWrappers.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[1]).toEqual(['unpivot']);
  });
});
