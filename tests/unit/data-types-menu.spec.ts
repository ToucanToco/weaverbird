import { mount, createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import DataTypesMenu from '@/components/DataTypesMenu.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Data Types Menu', () => {
  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(DataTypesMenu);

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).not.toContain('popover--active');
  });

  it('should instantiate with the popover active', () => {
    const wrapper = mount(DataTypesMenu, {
      propsData: {
        isActive: true,
      },
    });
    expect(wrapper.classes()).toContain('popover--active');
  });

  it('should contain the right set of data types', () => {
    const wrapper = shallowMount(DataTypesMenu);
    const options = wrapper.findAll('.data-types-menu__option');
    expect(options.at(0).html()).toContain('Integer');
    expect(options.at(1).html()).toContain('Float');
    expect(options.at(2).html()).toContain('Text');
    expect(options.at(3).html()).toContain('Date');
    expect(options.at(4).html()).toContain('Boolean');
  });

  describe('when clicking on a data type', () => {
    it('should add a valide convert step in the pipeline and select it', async () => {
      const store = setupMockStore({
        pipeline: [
          { name: 'domain', domain: 'test' },
          { name: 'delete', columns: ['test'] },
        ],
        selectedStepIndex: 0,
      });
      const wrapper = shallowMount(DataTypesMenu, {
        store,
        localVue,
        propsData: {
          columnName: 'columnA',
        },
      });
      const actionsWrapper = wrapper.findAll('.data-types-menu__option');
      actionsWrapper.at(0).trigger('click');
      await localVue.nextTick();
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'test' },
        { name: 'convert', columns: ['columnA'], data_type: 'integer' },
        { name: 'delete', columns: ['test'] },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore();
      const wrapper = shallowMount(DataTypesMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.data-types-menu__option');
      actionsWrapper.at(0).trigger('click');
      await localVue.nextTick();
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });
});
