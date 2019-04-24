import { shallowMount } from '@vue/test-utils';
import DataViewerCell from '../../src/components/DataViewerCell.vue';

describe.only('Data Viewer Cell', () => {
  it('should display the value', () => {
    const wrapper = shallowMount(DataViewerCell, {
      context: {
        props: {
          value: 'my_value',
        },
      },
    });

    expect(wrapper.text()).toEqual('my_value');
  });

  it('should have specific call when selected', () => {
    const wrapper = shallowMount(DataViewerCell, {
      context: {
        props: {
          value: 'my_value',
          isSelected: true,
        },
      },
    });

    expect(wrapper.classes()).toContain('data-viewer-cell--active');
  });
});
