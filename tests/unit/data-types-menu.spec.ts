import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';

import { DATA_TYPE } from '@/components/constants';
import DataTypesMenu from '@/components/DataTypesMenu.vue';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Data Types Menu', () => {
  it('should instantiate with the popover', () => {
    const wrapper = mount(DataTypesMenu);
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).toContain('popover-container');
  });

  it('should contain the right set of data types', () => {
    const wrapper = mount(DataTypesMenu);
    const options = wrapper.findAll('.menu__option');
    for (let i = 0; i < DATA_TYPE.length; i++) {
      expect(options.at(i).html()).toContain(DATA_TYPE[i].name);
    }
  });

  describe('when clicking on a data type', () => {
    it('should add a valid convert step in the pipeline and select it', async () => {
      for (let i = 0; i < DATA_TYPE.length; i++) {
        const store = setupMockStore(
          buildStateWithOnePipeline(
            [
              { name: 'domain', domain: 'test' },
              { name: 'delete', columns: ['test'] },
            ],
            {
              selectedStepIndex: 0,
            },
          ),
        );
        const wrapper = mount(DataTypesMenu, {
          store,
          localVue,
          propsData: {
            columnName: 'columnA',
          },
        });
        const actionsWrapper = wrapper.findAll('.menu__option');
        actionsWrapper.at(i).trigger('click');
        await localVue.nextTick();
        expect(store.getters[VQBnamespace('pipeline')]).toEqual([
          { name: 'domain', domain: 'test' },
          { name: 'convert', columns: ['columnA'], data_type: DATA_TYPE[i].name },
          { name: 'delete', columns: ['test'] },
        ]);
        expect(store.state.vqb.selectedStepIndex).toEqual(1);
      }
    });

    it('should emit a close event', async () => {
      for (let i = 0; i < DATA_TYPE.length; i++) {
        const store = setupMockStore();
        const wrapper = mount(DataTypesMenu, { store, localVue });
        const actionsWrapper = wrapper.findAll('.menu__option');
        actionsWrapper.at(i).trigger('click');
        await localVue.nextTick();
        expect(wrapper.emitted().closed).toBeTruthy();
      }
    });
  });
});
