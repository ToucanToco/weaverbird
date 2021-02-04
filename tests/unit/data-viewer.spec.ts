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
          isLoading: { dataset: true, uniqueValues: false },
        }),
      ),
      localVue,
    });
    const wrapperLoaderSpinner = wrapper.find('.data-viewer__loading-spinner');
    const wrapperDataViewerContainer = wrapper.find('.data-viewer-container');
    expect(wrapperLoaderSpinner.exists()).toBeTruthy();
    expect(wrapperDataViewerContainer.exists()).toBeFalsy();
  });

  describe('pagination', () => {
    it('should display pagination if Dataset is not complete', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          dataset: {
            // I let headers and data empty because I only want to test the pagination
            headers: [{ name: 'A' }],
            data: [['a']],
            // WARNING: the pagination context does not correspond to the headers and data above
            paginationContext: {
              totalCount: 50,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });
      expect(wrapper.find('Pagination-stub').exists()).toBeTruthy();
    });
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
              totalCount: 50,
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
              totalCount: 50,
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

    describe('column names', () => {
      let wrapper: Wrapper<DataViewer>;
      const vTooltipStub = jest.fn();

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
                totalCount: 50,
                pagesize: 10,
                pageno: 1,
              },
            },
          }),
        );
        wrapper = shallowMount(DataViewer, {
          store,
          localVue,
          directives: {
            tooltip: {
              bind: vTooltipStub,
            },
          },
        });
      });

      afterEach(() => {
        vTooltipStub.mockReset();
      });

      it("should contains column's names", () => {
        const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
        expect(headerCellsWrapper.at(0).text()).toContain('columnA');
        expect(headerCellsWrapper.at(1).text()).toContain('columnB');
        expect(headerCellsWrapper.at(2).text()).toContain('columnC');
      });

      it('should have a tooltip for each column', () => {
        expect(vTooltipStub).toHaveBeenCalledTimes(3);
      });
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
              totalCount: 50,
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
              { name: 'columnC', type: 'long' },
              { name: 'columnD', type: 'float' },
              { name: 'columnE', type: 'date' },
              { name: 'columnF', type: 'object' },
              { name: 'columnG', type: 'boolean' },
              { name: 'columnH', type: undefined },
            ],
            data: [['value1', 42, 3.14, date, { obj: 'value' }, true]],
            paginationContext: {
              totalCount: 10,
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
      expect(headerIconsWrapper.at(2).text()).toEqual('123');
      expect(headerIconsWrapper.at(3).text()).toEqual('1.2');
      expect(
        headerIconsWrapper
          .at(4)
          .find('i')
          .classes(),
      ).toEqual(['fas', 'fa-calendar-alt']);
      expect(headerIconsWrapper.at(5).text()).toEqual('{ }');
      expect(
        headerIconsWrapper
          .at(6)
          .find('i')
          .classes(),
      ).toEqual(['fas', 'fa-check']);
      expect(headerIconsWrapper.at(7).text()).toEqual('???');
    });

    it('should have a action menu for each column', async () => {
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
              totalCount: 50,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const actionMenuWrapperArray = wrapper.findAll('.data-viewer__header-action');
      expect(actionMenuWrapperArray.length).toEqual(3);

      const oneActionMenuIcon = actionMenuWrapperArray.at(0);
      // there is no ActionMenu visible yet:
      expect(oneActionMenuIcon.find('ActionMenu-stub').exists()).toBeFalsy;
      // on click on icon:
      await oneActionMenuIcon.trigger('click');
      // it should display ActionMenu:
      const actionMenuOpened = wrapper.findAll('ActionMenu-stub').at(0);
      expect(actionMenuOpened.vm.$props.visible).toBeTruthy();
      expect(wrapper.findAll('ActionMenu-stub').at(1).vm.$props.visible).toBeFalsy();
      expect(wrapper.findAll('ActionMenu-stub').at(2).vm.$props.visible).toBeFalsy();
      // when emit close:
      actionMenuOpened.vm.$emit('closed');
      // the Action menu disappear:
      expect(actionMenuOpened.vm.$props.visible).toBeFalsy();
    });

    it('should have a data type menu for supported backends', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          translator: 'mongo40',
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
            paginationContext: {
              totalCount: 10,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });
      // Icons are here:
      expect(wrapper.findAll('.data-viewer__header-icon--active').length).toEqual(3);
      // DataTypesMenu is not open yet:
      expect(wrapper.findAll('DataTypesMenu-stub').at(0).vm.$props.visible).toBeFalsy();
      // when click on icon:
      await wrapper
        .findAll('.data-viewer__header-icon--active')
        .at(0)
        .trigger('click');
      // it should open the DataTypesMenu
      expect(wrapper.findAll('DataTypesMenu-stub').at(0).vm.$props.visible).toBeTruthy();
      expect(wrapper.findAll('DataTypesMenu-stub').at(1).vm.$props.visible).toBeFalsy();
      expect(wrapper.findAll('DataTypesMenu-stub').at(2).vm.$props.visible).toBeFalsy();
      // when close:
      wrapper
        .findAll('DataTypesMenu-stub')
        .at(0)
        .vm.$emit('closed');
      await wrapper.vm.$nextTick();
      // DataTypesMenu is not open anymore:
      expect(wrapper.findAll('DataTypesMenu-stub').at(0).vm.$props.visible).toBeFalsy();
    });

    describe('changing columns', () => {
      let store: any, wrapper: any;
      const createWrapper = () => {
        store = setupMockStore(
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
                totalCount: 50,
                pagesize: 10,
                pageno: 1,
              },
            },
          }),
        );
        wrapper = shallowMount(DataViewer, { store, localVue });
      };

      it('should close the menu when the dataset is changed ...', async () => {
        createWrapper();
        const actionMenuWrapperArray = wrapper.findAll('.data-viewer__header-action');
        expect(actionMenuWrapperArray.length).toEqual(3);

        const oneActionMenuIcon = actionMenuWrapperArray.at(0);
        // there is no ActionMenu visible yet:
        expect(oneActionMenuIcon.find('ActionMenu-stub').exists()).toBeFalsy;
        // on click on icon:
        await oneActionMenuIcon.trigger('click');
        // it should display ActionMenu:
        const actionMenuOpened = wrapper.findAll('ActionMenu-stub').at(0);
        expect(actionMenuOpened.vm.$props.visible).toBeTruthy();
        // change the dataset
        store.commit('vqb/setDataset', {
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
          },
        });
        // the Action menu disappear:
        expect(actionMenuOpened.vm.$props.visible).toBeFalsy();
      });

      it('... but not when headers are not modified', async () => {
        createWrapper();
        await wrapper
          .findAll('.data-viewer__header-action')
          .at(0)
          .trigger('click');
        const actionMenuOpened = wrapper.findAll('ActionMenu-stub').at(0);
        expect(actionMenuOpened.vm.$props.visible).toBeTruthy();
        // load the values for columnA
        store.commit('vqb/setDataset', {
          dataset: {
            headers: [{ name: 'columnA', loaded: true }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
          },
        });
        // the action menu is still opened:
        expect(actionMenuOpened.vm.$props.visible).toBeTruthy();
      });
    });

    it('should not have an icon "data type menu" for not supported backends', () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          translator: 'mongo36',
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
            paginationContext: {
              totalCount: 10,
              pagesize: 10,
              pageno: 1,
            },
          },
        }),
      );
      const wrapper = shallowMount(DataViewer, { store, localVue });
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
                totalCount: 50,
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
              totalCount: 100,
              pagesize: 50,
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
              totalCount: 50,
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
          totalCount: 50,
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
              totalCount: 50,
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

    it('should open step form when click in one of toolbar button', () => {
      const actionToolbarWrapper = wrapper.findAll('actiontoolbar-stub').at(0);

      actionToolbarWrapper.vm.$emit('actionClicked', { stepName: 'rename' });
      expect(openStepFormStub).toBeCalledWith({ stepName: 'rename' });
    });
  });
});
