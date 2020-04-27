import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';

import ListUniqueValues from '@/components/ListUniqueValues.vue';
import { VQBnamespace } from '@/store/';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('List Unique Value', () => {
  let wrapper: Wrapper<Vue>;
  /**
  `shallowMountWrapper` is utility function for the `ListUniqueValues` component
  It shallow mount the component with several options:
  @param filterValue the value key of the prop `filter`
  @param operator the operator key of the prop `filter`
  @param loaded the `loaded` props of the component
  @param isUniqueValuesLoading the store parameter indicating if column unique value is loading

  By default the wrapper is mounted with 4 options: "France", "Framboise", "Spain" and "UK"
  - The checked values are "France" and "Spain"
  - All uniques are loaded
  */
  const shallowMountWrapper = (
    filterValue: string[] = ['France', 'Spain'],
    operator: 'in' | 'nin' = 'in',
    loaded = true,
    isUniqueValuesLoading = false,
  ): Wrapper<Vue> => {
    return shallowMount(ListUniqueValues, {
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'col1' }],
          data: [],
        },
        isLoading: {
          dataset: false,
          uniqueValues: isUniqueValuesLoading,
        },
      }),
      localVue,
      propsData: {
        filter: {
          column: 'col1',
          operator,
          value: filterValue,
        },
        options: [
          { value: 'France', count: 10 },
          { value: 'Framboise', count: 9 },
          { value: 'UK', count: 4 },
          { value: 'Spain', count: 2 },
        ],
        loaded,
      },
    });
  };
  beforeEach(() => {
    wrapper = shallowMountWrapper();
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
    wrapper = shallowMountWrapper(['France', 'Spain'], 'nin');
    expect(wrapper.exists()).toBeTruthy();
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.length).toEqual(4);
    expect(CheckboxWidgetArray.at(0).vm.$props.label).toEqual('France (10)');
    expect(CheckboxWidgetArray.at(1).vm.$props.label).toEqual('Framboise (9)');
    expect(CheckboxWidgetArray.at(2).vm.$props.label).toEqual('UK (4)');
    expect(CheckboxWidgetArray.at(3).vm.$props.label).toEqual('Spain (2)');
  });

  it('should instantiate with correct value checked (with "nin" operator)', () => {
    wrapper = shallowMountWrapper(['Framboise', 'UK'], 'nin');
    const CheckboxWidgetArray = wrapper.findAll('CheckboxWidget-stub');
    expect(CheckboxWidgetArray.at(0).vm.$props.value).toBeTruthy();
    expect(CheckboxWidgetArray.at(1).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(2).vm.$props.value).toBeFalsy();
    expect(CheckboxWidgetArray.at(3).vm.$props.value).toBeTruthy();
  });

  it('should instantiate without the spinner', async () => {
    expect(wrapper.find('.list-unique-values__loader-spinner').exists()).toBeFalsy();
  });

  it('should instantiate with the spinner', async () => {
    wrapper = shallowMountWrapper(['France', 'Spain'], 'in', true, true);
    expect(wrapper.find('.list-unique-values__loader-spinner').exists()).toBeTruthy();
  });

  describe('"load all values" message', () => {
    it('should instantiate with the "load all values" message', () => {
      expect(wrapper.find('.list-unique-values__load-all-values').exists()).toBeFalsy();
    });

    it('should dispatch when click on "load all values"', async () => {
      wrapper = shallowMountWrapper(['France', 'Spain'], 'in', false);
      const dispatchSpy = jest.spyOn(wrapper.vm.$store, 'dispatch');
      await wrapper.find('.list-unique-values__load-all-values-button').trigger('click');
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith(VQBnamespace('loadColumnUniqueValues'), {
        column: 'col1',
      });
    });

    it('should not instantiate with the "load all values" message', () => {
      wrapper = shallowMountWrapper(['France', 'Spain'], 'in', false);
      expect(wrapper.find('.list-unique-values__load-all-values').exists()).toBeTruthy();
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
      wrapper = shallowMountWrapper(['France', 'Spain'], 'nin');
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
