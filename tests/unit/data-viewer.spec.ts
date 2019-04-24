import { shallowMount } from '@vue/test-utils';
import DataViewer from '../../src/components/DataViewer.vue';

describe('Data Viewer', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(DataViewer);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display a message when no data', () => {
    const wrapper = shallowMount(DataViewer, {
      propsData: {
        dataset: [],
      },
    });

    expect(wrapper.text()).toEqual('No Data Available');
  });

  describe('header', () => {
    it('should have one row', () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });

      const headerWrapper = wrapper.find('.data-viewer__header');
      expect(headerWrapper.findAll('tr').length).toEqual(1);
    });

    it('should have three cells', () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.length).toEqual(3);
    });

    it("should contains column's names", () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });

      const headerCellsWrapper = wrapper.findAll('.data-viewer__header-cell');
      expect(headerCellsWrapper.at(0).text()).toEqual('columnA');
      expect(headerCellsWrapper.at(1).text()).toEqual('columnB');
      expect(headerCellsWrapper.at(2).text()).toEqual('columnC');
    });

    describe('when clicking', () => {
      it('should add an active class on the cell', () => {
        const dataset = [
          { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
          { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
          { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
          { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
          { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
        ];
        const wrapper = shallowMount(DataViewer, {
          propsData: {
            dataset: dataset,
          },
        });

        const firstHeaderCellWrapper = wrapper.find('.data-viewer__header-cell');
        firstHeaderCellWrapper.trigger('click');
        expect(firstHeaderCellWrapper.classes()).toContain('data-viewer__header-cell--active');
      });
    });
  });

  describe('body', () => {
    it('should have 5 rows', () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });

      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      expect(rowsWrapper.length).toEqual(5);
    });

    it('should pass down the right value to DataViewerCell', () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });

      const firstRowWrapper = wrapper.find('.data-viewer__row');
      const firstCellWrapper = firstRowWrapper.find('dataviewercell-stub');
      // Syntax specific to stubbed functional Vue Component
      expect(firstCellWrapper.attributes('value')).toEqual('value1');
    });
  });

  describe('when clicking on first head cell', () => {
    it('should select all first columns cells', () => {
      const dataset = [
        { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
        { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
        { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
        { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
        { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
      ];
      const wrapper = shallowMount(DataViewer, {
        propsData: {
          dataset: dataset,
        },
      });
      const firstHeadCellWrapper = wrapper.find('.data-viewer__header-cell');
      firstHeadCellWrapper.trigger('click');

      const rowsWrapper = wrapper.findAll('.data-viewer__row');
      dataset.forEach((d, i) => {
        expect(
          rowsWrapper
            .at(i)
            .find('dataviewercell-stub')
            .attributes('isselected'),
        ).toBeTruthy();
      });
    });
  });
});
