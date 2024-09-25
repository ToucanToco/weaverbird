import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';

const localVue = createLocalVue();

describe('Widget ReplaceWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ReplaceWidget, { localVue, sync: false });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two InputTextWidget components', () => {
    const wrapper = shallowMount(ReplaceWidget, { localVue, sync: false });
    const widgetWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should pass down the properties to the input components', () => {
    const wrapper = shallowMount(ReplaceWidget, {
      localVue,
      sync: false,
      propsData: {
        value: ['foo', 'bar'],
      },
    });
    const widgetWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
    expect(widgetWrappers.at(1).props().value).toEqual('bar');
  });

  it('should emit value on created if values are empty', () => {
    const wrapper = shallowMount(ReplaceWidget, {
      localVue,
      sync: false,
    });
    expect(wrapper.emitted().input[0][0]).toEqual(['', '']);
  });

  it('should not emit value on created if there is some value', () => {
    const wrapper = shallowMount(ReplaceWidget, {
      propsData: {
        value: ['lolilol', 'yolo'],
      },
      localVue,
      sync: false,
    });
    expect(wrapper.emitted().input).toBe(undefined);
  });

  it('should emit "input" event with correct updated values when input valueToReplace is updated', async () => {
    const wrapper = shallowMount(ReplaceWidget, {
      propsData: {
        value: ['yolo', 'bim'],
      },
      localVue,
      sync: false,
    });
    wrapper.findAll('InputTextWidget-stub').at(0).vm.$emit('input', 'foo');
    expect(wrapper.emitted().input[0][0]).toEqual(['foo', 'bim']);
  });

  it('should emit "input" event with correct updated values when input newValueToReplace is updated', async () => {
    const wrapper = shallowMount(ReplaceWidget, {
      propsData: {
        value: ['yolo', 'bim'],
      },
      localVue,
      sync: false,
    });
    wrapper.findAll('InputTextWidget-stub').at(1).vm.$emit('input', 'bar');
    expect(wrapper.emitted().input[0][0]).toEqual(['yolo', 'bar']);
  });
});
