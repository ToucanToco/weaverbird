import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import DataViewerCell from '@/components/DataViewerCell.vue';

describe('Data Viewer Cell', () => {
  it('should instantiate with no value', () => {
    const wrapper = shallowMount(DataViewerCell);
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.text()).to.equal('-');
  });
  it('should instantiate with value undefined', () => {
    const wrapper = shallowMount(DataViewerCell, {
      context: {
        props: {
          value: undefined,
        },
      },
    });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.text()).to.equal('-');
  });
  describe('value is a string', () => {
    it('should display the value', () => {
      const wrapper = shallowMount(DataViewerCell, {
        context: {
          props: {
            value: 'my_value',
          },
        },
      });
      expect(wrapper.text()).to.equal('my_value');
    });
  });
  describe('value is a number', () => {
    it('should display the value', () => {
      const wrapper = shallowMount(DataViewerCell, {
        context: {
          props: {
            value: 12,
          },
        },
      });
      expect(wrapper.text()).to.equal('12');
    });
  });
  describe('value is an object', () => {
    it('should display the value', () => {
      const wrapper = shallowMount(DataViewerCell, {
        context: {
          props: {
            value: { my_column: 'my_value' },
          },
        },
      });
      expect(wrapper.text()).to.eql('{"my_column":"my_value"}');
    });
  });
  it('should have specific class when selected', () => {
    const wrapper = shallowMount(DataViewerCell, {
      context: {
        props: {
          value: 'my_value',
          isSelected: true,
        },
      },
    });
    expect(wrapper.classes()).to.include('data-viewer-cell--active');
  });
});
