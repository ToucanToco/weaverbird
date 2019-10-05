import { mount, createLocalVue } from '@vue/test-utils';
import ActionToolbarButton from '@/components/ActionToolbarButton.vue';
import Vuex from 'vuex';
import { setupMockStore } from './utils';

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

  it('should instantiate a Text button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'text' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(5);
    actionsWrappers.at(0).trigger('click');
    expect(wrapper.emitted().actionClicked).toHaveLength(1);
    expect(wrapper.emitted().actionClicked[0]).toEqual(['concatenate']);
    actionsWrappers.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked).toHaveLength(2);
    expect(wrapper.emitted().actionClicked[1]).toEqual(['split']);
    actionsWrappers.at(2).trigger('click');
    expect(wrapper.emitted().actionClicked).toHaveLength(3);
    expect(wrapper.emitted().actionClicked[2]).toEqual(['substring']);
    // clicking on "lowercase" ou "uppercase" should not trigger "actionClicked"
    // since we don't use an edit form for these steps.
    actionsWrappers.at(3).trigger('click');
    expect(wrapper.emitted().actionClicked).toHaveLength(3);
    actionsWrappers.at(4).trigger('click');
    expect(wrapper.emitted().actionClicked).toHaveLength(3);
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

  describe('When clicking on the "To lowercase" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(3).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(3).trigger('click');
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'lowercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(3).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('When clicking on the "To uppercase" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'uppercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });
});
