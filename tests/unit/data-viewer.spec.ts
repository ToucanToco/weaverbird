import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { setupStore } from '@/store';
import DataViewer from '../../src/components/DataViewer.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Data Viewer', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(DataViewer, { store: setupStore(), localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display a message when no data', () => {
    const wrapper = shallowMount(DataViewer, { store: setupStore(), localVue });

    expect(wrapper.text()).toEqual('No data available');
  });

  it('should display a loader spinner when data is loading and hide data viewer container', () => {
    const wrapper = shallowMount(DataViewer, {
      store: setupStore({
        isLoading: true,
      }),
      localVue,
    });
    const wrapperLoaderSpinner = wrapper.find('.data-viewer-loader-spinner');
    const wrapperDataViewerContainer = wrapper.find('.data-viewer-container');
    expect(wrapperLoaderSpinner.exists()).toBeTruthy();
    expect(wrapperDataViewerContainer.exists()).toBeFalsy();
  });

  describe('header', () => {
    it('should have one row', () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [
            ['value1', 'value2', 'value3'],
            ['value4', 'value5', 'value6'],
            ['value7', 'value8', 'value9'],
            ['value10', 'value11', 'value12'],
            ['value13', 'value14', 'value15'],
          ],
        },
      });
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerWrapper = wrapper.find('.data-viewer__header');
      expect(headerWrapper.findAll('tr').length).toEqual(1);
    });

    it('should have three cells', () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [
            ['value1', 'value2', 'value3'],
            ['value4', 'value5', 'value6'],
            ['value7', 'value8', 'value9'],
            ['value10', 'value11', 'value12'],
            ['value13', 'value14', 'value15'],
          ],
        },
      });
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.length).toEqual(3);
    });

    it("should contains column's names", () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [
            ['value1', 'value2', 'value3'],
            ['value4', 'value5', 'value6'],
            ['value7', 'value8', 'value9'],
            ['value10', 'value11', 'value12'],
            ['value13', 'value14', 'value15'],
          ],
        },
      });
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.at(0).text()).toEqual('columnA');
      expect(headerCellsWrapper.at(1).text()).toEqual('columnB');
      expect(headerCellsWrapper.at(2).text()).toEqual('columnC');
    });

    it("should contains column's names even if not on every rows", () => {
      const store = setupStore({
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
        },
      });
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.at(0).text()).toEqual('columnA');
      expect(headerCellsWrapper.at(1).text()).toEqual('columnB');
      expect(headerCellsWrapper.at(2).text()).toEqual('columnC');
      expect(headerCellsWrapper.at(3).text()).toEqual('columnD');
    });

    it('should display the right icon for each types', () => {
      const date = new Date();
      const store = setupStore({
        dataset: {
          headers: [
            { name: 'columnA', type: 'string' },
            { name: 'columnB', type: 'integer' },
            { name: 'columnC', type: 'float' },
            { name: 'columnD', type: 'date' },
            { name: 'columnE', type: 'object' },
            { name: 'columnF', type: 'boolean' },
          ],
          data: [['value1', 42, 3.14, date, { obj: 'value' }, true]],
        },
      });
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
    });

    describe('selection', () => {
      it('should add an active class on the cell', async () => {
        const store = setupStore({
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
          },
        });
        const wrapper = shallowMount(DataViewer, { store, localVue });

        const firstHeaderCellWrapper = wrapper.find('.data-viewer__header-cell');
        firstHeaderCellWrapper.trigger('click');
        await localVue.nextTick();
        expect(firstHeaderCellWrapper.classes()).toContain('data-viewer__header-cell--active');
      });

      it('should open the action menu', async () => {
        const store = setupStore({
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [
              ['value1', 'value2', 'value3'],
              ['value4', 'value5', 'value6'],
              ['value7', 'value8', 'value9'],
              ['value10', 'value11', 'value12'],
              ['value13', 'value14', 'value15'],
            ],
          },
        });
        const wrapper = shallowMount(DataViewer, { store, localVue });

        const firstHeaderCellWrapper = wrapper.find('.data-viewer__header-cell');
        firstHeaderCellWrapper.trigger('click');
        await localVue.nextTick();
        expect(wrapper.find('actionmenu-stub').exists()).toBeTruthy();
      });
    });
  });

  describe('body', () => {
    it('should have 5 rows', () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [
            ['value1', 'value2', 'value3'],
            ['value4', 'value5', 'value6'],
            ['value7', 'value8', 'value9'],
            ['value10', 'value11', 'value12'],
            ['value13', 'value14', 'value15'],
          ],
        },
      });
      const wrapper = shallowMount(DataViewer, { store, localVue });

      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      expect(rowsWrapper.length).toEqual(5);
    });

    it('should pass down the right value to DataViewerCell', () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [
            ['value1', 'value2', 'value3'],
            ['value4', 'value5', 'value6'],
            ['value7', 'value8', 'value9'],
            ['value10', 'value11', 'value12'],
            ['value13', 'value14', 'value15'],
          ],
        },
      });
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
      };
      const store = setupStore({ dataset });
      const wrapper = shallowMount(DataViewer, { store, localVue });
      const firstHeadCellWrapper = wrapper.find('.data-viewer__header-cell');
      firstHeadCellWrapper.trigger('click');
      await localVue.nextTick();
      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      dataset.data.forEach((d, i) => {
        expect(
          rowsWrapper
            .at(i)
            .find('dataviewercell-stub')
            .attributes('isselected'),
        ).toEqual('true');
      });
    });
  });
});
