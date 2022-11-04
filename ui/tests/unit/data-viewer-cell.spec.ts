import { shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';

import DataViewerCell from '@/components/DataViewerCell.vue';

describe('Data Viewer Cell', () => {
  it('should instantiate with no value', () => {
    const wrapper = shallowMount(DataViewerCell);
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.text()).toEqual('-');
  });
  it('should instantiate with value undefined', () => {
    const wrapper = shallowMount(DataViewerCell, {
      propsData: {
        value: undefined,
      },
    });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.text()).toEqual('-');
  });
  describe('value is a string', () => {
    it('should display the value', () => {
      const wrapper = shallowMount(DataViewerCell, {
        propsData: {
          value: 'my_value',
        },
      });
      expect(wrapper.text()).toEqual('my_value');
    });
  });
  describe('value is a number', () => {
    let wrapper: Wrapper<Vue>;

    beforeEach(() => {
      wrapper = shallowMount(DataViewerCell, {
        propsData: {
          value: 12,
        },
      });
    });

    it('should display the value', () => {
      expect(wrapper.text()).toEqual('12');
    });

    it('should has a specific style to align the numbers to the right', () => {
      expect(wrapper.classes()).toContain('data-viewer-cell--numeric');
    });
  });
  describe('value is an object', () => {
    it('should display the value', () => {
      const wrapper = shallowMount(DataViewerCell, {
        propsData: {
          value: { my_column: 'my_value' },
        },
      });
      expect(wrapper.text()).toEqual('{"my_column":"my_value"}');
    });
  });
  describe('value is a date', () => {
    it('should display the value', () => {
      const date = new Date();
      const wrapper = shallowMount(DataViewerCell, {
        propsData: {
          value: date,
        },
      });
      expect(wrapper.text()).toEqual(date.toString());
    });
  });
});
