import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import ListUniqueValues from '@/components/ListUniqueValues.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('List Unique Value', () => {
  const DUMMY_UNIQUE_VALUES = [
    { value: 'A', nbOcc: 10 },
    { value: 'B', nbOcc: 4 },
    { value: 'C', nbOcc: 2 },
  ];
  it('should instantiate with the correct unique values', () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });

    expect(wrapper.exists()).toBeTruthy();
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.length).toEqual(3);
    expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('A (10)');
    expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('B (4)');
    expect(CheckboxWidgetArray.at(2).vm.$props.label).toEqual('C (2)');
  });

  it('should instantiate with all checkbox checked', () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });

    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeTruthy();
  });

  // click on one value: (checkbox emit 'input' event)
  it('should unselect on click one of checkbox', () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    CheckboxWidgetArray.at(0).vm.$emit('input'); // unselecting "A" value
    // "A" should not be checked:
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeFalsy();
    // But "B" and "C" should be checked:
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeTruthy();
  });

  it('should emit input on a checkbox', () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });
    wrapper
      .findAll('CheckboxWidget-stub')
      .at(0)
      .vm.$emit('input'); // unselecting "A" value
    expect(wrapper.emitted().input[0][0]).toEqual(['B', 'C']);
  });

  // clear all click:
  it('should unselect all when click on clear all button', async () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });

    await wrapper.find('.list-unique-values__clear-all').trigger('click');
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    // No value should not be checked:
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeFalsy();
  });

  it('should emit input on click clear all button', async () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });
    await wrapper.find('.list-unique-values__clear-all').trigger('click');
    expect(wrapper.emitted().input[0][0]).toEqual([]);
  });

  // select all click:
  it('should select all when click on select all button', async () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });

    await wrapper.find('.list-unique-values__clear-all').trigger('click'); // unselect all
    await wrapper.vm.$nextTick();
    await wrapper.find('.list-unique-values__select-all').trigger('click');
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    // All values should be checked:
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeTruthy();
  });

  it('should emit input on click select all button', async () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });
    await wrapper.find('.list-unique-values__select-all').trigger('click');
    expect(wrapper.emitted().input[0][0]).toEqual(['A', 'B', 'C']);
  });

  // search box:
  it('should filter the unique value when search on the searchbox', async () => {
    const wrapper = shallowMount(ListUniqueValues, {
      propsData: { values: DUMMY_UNIQUE_VALUES },
    });

    const input = wrapper.find('.list-unique-values__search-box').element as HTMLInputElement;
    input.value = 'A';
    await wrapper.find('.list-unique-values__search-box').trigger('input');
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.length).toEqual(1);
    expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('A (10)');
  });
});
