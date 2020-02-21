import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';

import DataViewer from '../../src/components/DataViewer.vue';
import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Data Viewer', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(DataViewer, { store: setupMockStore(), localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display an empty state is no pipeline is selected', () => {
    const wrapper = shallowMount(DataViewer, { store: setupMockStore({}), localVue });
    expect(wrapper.find('.data-viewer--no-pipeline').exists()).toBeTruthy();
    expect(wrapper.find('ActionToolbar-stub').exists()).toBeFalsy();
  });

  it('should display a message when no data', () => {
    const wrapper = shallowMount(DataViewer, { store: setupMockStore(), localVue });

    expect(wrapper.text()).toEqual('No data available');
  });

  it('should display a loader spinner when data is loading and hide data viewer container', () => {
    const wrapper = shallowMount(DataViewer, {
      store: setupMockStore(
        buildStateWithOnePipeline([], {
          isLoading: true,
        }),
      ),
      localVue,
    });
    const wrapperLoaderSpinner = wrapper.find('.data-viewer-loader-spinner');
    const wrapperDataViewerContainer = wrapper.find('.data-viewer-container');
    expect(wrapperLoaderSpinner.exists()).toBeTruthy();
    expect(wrapperDataViewerContainer.exists()).toBeFalsy();
  });

  describe('header', () => {
    it('should have one row', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerWrapper = wrapper.find('.data-viewer__header');
      expect(headerWrapper.findAll('tr').length).toEqual(1);
    });

    it('should have three cells', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.length).toEqual(3);
    });

    it("should contains column's names", () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.at(0).text()).toContain('columnA');
      expect(headerCellsWrapper.at(1).text()).toContain('columnB');
      expect(headerCellsWrapper.at(2).text()).toContain('columnC');
    });

    it("should contains column's names even if not on every rows", () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [
              { name: 'columnA' },
              { name: 'columnB' },
              { name: 'columnC' },
              { name: 'columnD' },
            ],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15', 'value16'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.at(0).text()).toContain('columnA');
      expect(headerCellsWrapper.at(1).text()).toContain('columnB');
      expect(headerCellsWrapper.at(2).text()).toContain('columnC');
      expect(headerCellsWrapper.at(3).text()).toContain('columnD');
    });

    it('should display the right icon for each types', () => {
      const date = new Date();
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [
              { name: 'columnA', type: 'string' },
              { name: 'columnB', type: 'integer' },
              { name: 'columnC', type: 'float' },
              { name: 'columnD', type: 'date' },
              { name: 'columnE', type: 'object' },
              { name: 'columnF', type: 'boolean' },
              { name: 'columnG', type: undefined },
            ],
            data: [['value1', 42, 3.14, date, { obj: 'value' }, true]],
            paginationContext: {
              totalCount: 1,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerIconsWrapper = wrapper.findAll('.data-viewer__header-icon');
      expect(headerIconsWrapper.at(0).text()).toEqual('ABC');
      expect(headerIconsWrapper.at(1).text()).toEqual('123');
      expect(headerIconsWrapper.at(2).text()).toEqual('1.2');
      expect(
        headerIconsWrapper
          .at(3)
          .find('i')
          .classes(),
      ).toEqual(['fas', 'fa-calendar-alt']);
      expect(headerIconsWrapper.at(4).text()).toEqual('{ }');
      expect(
        headerIconsWrapper
          .at(5)
          .find('i')
          .classes(),
      ).toEqual(['fas', 'fa-check']);
      expect(headerIconsWrapper.at(6).text()).toEqual('???');
    });

    it('should have a data type menu for supported backends', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          translator: 'mongo40',
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
            paginationContext: {
              totalCount: 1,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });
      expect(wrapper.find('datatypesmenu-stub').exists()).toBeTruthy();
      expect(wrapper.find('.data-viewer__header-icon--active').exists()).toBeTruthy();
      wrapper.find('.data-viewer__header-icon--active').trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$data.indexActiveDataTypeMenu).toEqual(0);
      wrapper.find('datatypesmenu-stub').trigger('closed');
      await localVue.nextTick();
    });

    it('should have a data type menu for not supported backends', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          translator: 'mongo36',
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
            paginationContext: {
              totalCount: 1,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });
      expect(wrapper.find('datatypesmenu-stub').exists()).toBeFalsy();
      expect(wrapper.find('.data-viewer__header-icon--active').exists()).toBeFalsy();
    });

    describe('selection', () => {
      it('should add an active class on the cell', async () => {
        const store = setupMockStore(
          buildStateWithOnePipeline([], {
            dataset: {
              headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
              data: [
                ['value1', 'value2', 'value3'],
                ['value4', 'value5', 'value6'],
                ['value7', 'value8', 'value9'],
                ['value10', 'value11', 'value12'],
                ['value13', 'value14', 'value15'],
              ],
              paginationContext: {
                totalCount: 5,
                pagesize: 10,
                pageno: 1,
              },
            },
          }),
        );
        const wrapper = shallowMount(DataViewer, { store, localVue });

        const firstHeaderCellWrapper = wrapper.find('.data-viewer__header-cell');
        firstHeaderCellWrapper.trigger('click');
        await localVue.nextTick();
        expect(firstHeaderCellWrapper.classes()).toContain('data-viewer__header-cell--active');
      });
    });
  });

  describe('body', () => {
    it('should have 5 rows', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      expect(rowsWrapper.length).toEqual(5);
    });

    it('should pass down the right value to DataViewerCell', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const firstRowWrapper = wrapper.find('.data-viewer__row');
      const firstCellWrapper = firstRowWrapper.find('dataviewercell-stub');
      // Syntax specific to stubbed functional Vue Component
      expect(firstCellWrapper.attributes('value')).toEqual('value1');
    });
  });
  describe('first column selection', () => {
    it('should select all first columns cells', async () => {
      const dataset = {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [
          ['value1', 'value2', 'value3'],
          ['value4', 'value5', 'value6'],
          ['value7', 'value8', 'value9'],
          ['value10', 'value11', 'value12'],
          ['value13', 'value14', 'value15'],
        ],
        paginationContext: {
          totalCount: 5,
          pagesize: 10,
          pageno: 1,
        },
      };
      const store = setupMockStore(buildStateWithOnePipeline([], { dataset }));
      const wrapper = shallowMount(DataViewer, { store, localVue });
      const firstHeadCellWrapper = wrapper.find('.data-viewer__header-cell');
      firstHeadCellWrapper.trigger('click');
      await localVue.nextTick();
      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      dataset.data.forEach((_d, i) => {
        expect(
          rowsWrapper
            .at(i)
            .find('dataviewercell-stub')
            .attributes('isselected'),
        ).toEqual('true');
      });
    });
  });

  describe('action clicked in ActionToolbar', () => {
    let wrapper: Wrapper<Vue>;
    const openStepFormStub = jest.fn();

    beforeEach(() => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
            paginationContext: {
              totalCount: 5,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      wrapper = shallowMount(DataViewer, { store, localVue });
      wrapper.setMethods({ openStepForm: openStepFormStub });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should open step form when click in toolbar', () => {
      const actionMenuWrapper = wrapper.find('actiontoolbar-stub');

      actionMenuWrapper.vm.$emit('actionClicked', { stepName: 'rename' });
      expect(openStepFormStub).toBeCalledWith({ stepName: 'rename' });
    });

    it('should open step form when click in action menu', async () => {
      const actionMenuWrapper = wrapper.find('actionmenu-stub');

      actionMenuWrapper.vm.$emit('actionClicked', { stepName: 'rename' });
      expect(openStepFormStub).toBeCalledWith({ stepName: 'rename' });
    });
  });
});
