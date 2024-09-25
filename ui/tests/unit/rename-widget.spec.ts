import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RenameWidget from '@/components/stepforms/widgets/Rename.vue';

const localVue = createLocalVue();

describe('Widget RenameWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(RenameWidget, { localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 1 ColumnPicker and 1 InputTextWidget components', () => {
    const wrapper = shallowMount(RenameWidget, { localVue, sync: false });
    const columnPickerWrappers = wrapper.findAll('ColumnPicker-stub');
    const inputTextWidgetWrappers = wrapper.findAll('InputTextWidget-stub');
    expect(columnPickerWrappers.length).toEqual(1);
    expect(inputTextWidgetWrappers.length).toEqual(1);
  });

  it('should pass down the properties to the input components', () => {
    const wrapper = shallowMount(RenameWidget, {
      localVue,
      sync: false,
      propsData: {
        columnNames: ['foo'],
        value: ['foo', 'bar'],
      },
    });
    const columnPickerWrapper = wrapper.find('ColumnPicker-stub');
    const inputTextWidgetWrapper = wrapper.find('InputTextWidget-stub');
    expect(columnPickerWrapper.props().value).toEqual('foo');
    expect(inputTextWidgetWrapper.props().value).toEqual('bar');
  });

  it('should emit value on created if values are empty', () => {
    const wrapper = shallowMount(RenameWidget, {
      localVue,
      sync: false,
    });
    expect(wrapper.emitted().input[0][0]).toEqual(['', '']);
  });

  it('should not emit value on created if there is some value', () => {
    const wrapper = shallowMount(RenameWidget, {
      propsData: {
        columnNames: ['lolilol'],
        value: ['lolilol', 'yolo'],
      },
      localVue,
      sync: false,
    });
    expect(wrapper.emitted().input).toBe(undefined);
  });

  it('should emit "input" event with correct updated values when input columnToRename is updated', () => {
    const wrapper = shallowMount(RenameWidget, {
      propsData: {
        columnNames: ['yolo'],
        value: ['yolo', 'bim'],
      },
      localVue,
      sync: false,
    });
    wrapper.find('ColumnPicker-stub').vm.$emit('input', 'foo');
    expect(wrapper.emitted().input[0][0]).toEqual(['foo', 'bim']);
  });

  it('should emit "input" event with correct updated values when input newColumnToRename is updated', () => {
    const wrapper = shallowMount(RenameWidget, {
      propsData: {
        columnNames: ['yolo'],
        value: ['yolo', 'bim'],
      },
      localVue,
      sync: false,
    });
    wrapper.find('InputTextWidget-stub').vm.$emit('input', 'bar');
    expect(wrapper.emitted().input[0][0]).toEqual(['yolo', 'bar']);
  });

  describe('Warning', () => {
    it('should report a warning when newColumn is an already existing column name', () => {
      const wrapper = shallowMount(RenameWidget, {
        propsData: {
          columnNames: ['columnA'],
          value: ['yolo', 'columnA'],
        },
        localVue,
        sync: false,
      });
      expect(wrapper.find('.newColumn').props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if newColumn is not an already existing column name', () => {
      const wrapper = shallowMount(RenameWidget, {
        propsData: {
          columnNames: ['columnA'],
          value: ['yolo', 'columnB'],
        },
        localVue,
        sync: false,
      });
      expect(wrapper.find('.newColumn').props().warning).toBeNull();
    });
  });
});
