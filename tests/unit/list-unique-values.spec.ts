import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import ListUniqueValues from '@/components/ListUniqueValues.vue';
import { FilterConditionInclusion } from '@/lib/steps.ts';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('List Unique Value', () => {
  const DUMMY_UNIQUE_VALUES = [
    { value: 'France', count: 10 },
    { value: 'Framboise', count: 9 },
    { value: 'UK', count: 4 },
    { value: 'Spain', count: 2 },
  ];
  let filter!: FilterConditionInclusion;
  let wrapper: any;

  beforeEach(() => {
    filter = {
      column: 'col1',
      operator: 'in',
      value: ['France', 'Spain'],
    };
    wrapper = shallowMount(ListUniqueValues, {
      propsData: { filter, options: DUMMY_UNIQUE_VALUES, loaded: true },
    });
  });

  it('should display the list of unique values and how much time they are present in the whole dataset', () => {
    expect(wrapper.exists()).toBeTruthy();
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.length).toEqual(4);
    expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('France (10)');
    expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('Framboise (9)');
    expect(CheckboxWidgetArray.at(2).vm.$props.label).toEqual('UK (4)');
    expect(CheckboxWidgetArray.at(3).vm.$props.label).toEqual('Spain (2)');
  });

  it('should instantiate with correct value checked', () => {
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(3).vm.$props.value).toBeTruthy();
  });

  it('should display the list of unique values and how much time they are present in the whole dataset (with "nin" operator)', () => {
    filter = {
      column: 'col1',
      operator: 'nin',
      value: ['Framboise', 'UK'],
    };
    wrapper = shallowMount(ListUniqueValues, {
      propsData: { filter, options: DUMMY_UNIQUE_VALUES, loaded: true },
    });
    expect(wrapper.exists()).toBeTruthy();
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.length).toEqual(4);
    expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('France (10)');
    expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('Framboise (9)');
    expect(CheckboxWidgetArray.at(2).vm.$props.label).toEqual('UK (4)');
    expect(CheckboxWidgetArray.at(3).vm.$props.label).toEqual('Spain (2)');
  });

  it('should instantiate with correct value checked (with "nin" operator)', () => {
    filter = {
      column: 'col1',
      operator: 'nin',
      value: ['Framboise', 'UK'],
    };
    wrapper = shallowMount(ListUniqueValues, {
      propsData: { filter, options: DUMMY_UNIQUE_VALUES, loaded: true },
    });
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(3).vm.$props.value).toBeTruthy();
  });

  describe('"load all values" message', () => {
    it('should instantiate with the "load all values" message', () => {
      expect(wrapper.find('.list-unique-values__load-all-values').exists()).toBeTruthy();
    });

    it('should throw an error when click on "load all values"', async () => {
      try {
        await wrapper.find('.list-unique-values__load-all-values-button').trigger('click');
      } catch (e) {
        expect(e).toEqual(Error('Not implemented'));
      }
    });

    it('should not instantiate with the "load all values" message', () => {
      wrapper = shallowMount(ListUniqueValues, {
        propsData: { filter, options: DUMMY_UNIQUE_VALUES, loaded: false },
      });
      expect(wrapper.find('.list-unique-values__load-all-values').exists()).toBeFalsy();
    });
  });

  describe('click on one checkbox', () => {
    it('should emit new value', () => {
      wrapper
        .findAll('CheckboxWidget-stub')
        .at(0)
        .vm.$emit('input'); // unselecting "France" value
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'in',
        value: ['Spain'],
      });
    });

    it('should emit new value', () => {
      wrapper
        .findAll('CheckboxWidget-stub')
        .at(1)
        .vm.$emit('input'); // unselecting "Framboise" value
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'in',
        value: ['France', 'Spain', 'Framboise'],
      });
    });
  });

  describe('click on "Clear all" button', () => {
    it('should emit input on click clear all button', async () => {
      await wrapper.find('.list-unique-values__clear-all').trigger('click');
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'in',
        value: [],
      });
    });
  });

  describe('click on "Select all" button', () => {
    it('should emit input on click select all button', async () => {
      await wrapper.find('.list-unique-values__select-all').trigger('click');
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'nin',
        value: [],
      });
    });
  });

  describe('search box with "in" operator', () => {
    beforeEach(async () => {
      const input = wrapper.find('.list-unique-values__search-box').element as HTMLInputElement;
      input.value = 'Fr'; // "Fr" like the start of "France" and "Framboise"
      await wrapper.find('.list-unique-values__search-box').trigger('input');
    });

    it('should filter the unique value when search on the searchbox', async () => {
      const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
      expect(CheckboxWidgetArray.length).toEqual(2);
      expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('France (10)');
      expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('Framboise (9)');
    });

    it('should emit new value when click "select all" button (with "in" operator)', async () => {
      await wrapper.find('.list-unique-values__select-all').trigger('click');
      // "France" and "Framboise" only should be updated:
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'in',
        value: ['France', 'Spain', 'Framboise'],
      });
    });

    it('should emit new value when click "clear all" button (with "in" operator)', async () => {
      await wrapper.find('.list-unique-values__clear-all').trigger('click');
      // "France" and "Framboise" only should be updated
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'in',
        value: ['Spain'],
      });
    });
  });

  describe('search box with "nin" operator', () => {
    beforeEach(async () => {
      filter = {
        column: 'col1',
        operator: 'nin',
        value: ['France', 'Spain'],
      };
      wrapper = shallowMount(ListUniqueValues, {
        propsData: { filter, options: DUMMY_UNIQUE_VALUES, loaded: true },
      });
      const input = wrapper.find('.list-unique-values__search-box').element as HTMLInputElement;
      input.value = 'Fr'; // "Fr" like the start of "France" and "Framboise"
      await wrapper.find('.list-unique-values__search-box').trigger('input');
    });

    it('should filter the unique value when search on the searchbox', async () => {
      const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
      expect(CheckboxWidgetArray.length).toEqual(2);
      expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('France (10)');
      expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('Framboise (9)');
    });

    it('should emit new value when click "select all" button (with "nin" operator)', async () => {
      await wrapper.find('.list-unique-values__select-all').trigger('click');
      // "France" and "Framboise" only should be updated:
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'nin',
        value: ['Spain'],
      });
    });

    it('should emit new value when click "clear all" button (with "nin" operator)', async () => {
      await wrapper.find('.list-unique-values__clear-all').trigger('click');
      // "France" and "Framboise" only should be updated
      expect(wrapper.emitted().input[0][0]).toEqual({
        column: 'col1',
        operator: 'nin',
        value: ['France', 'Spain', 'Framboise'],
      });
    });
  });
});
