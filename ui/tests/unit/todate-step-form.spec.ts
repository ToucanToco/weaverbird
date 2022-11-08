import type { Wrapper } from '@vue/test-utils';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Vuex from 'vuex';

import ToDateStepForm from '@/components/stepforms/ToDateStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

vi.mock('@/components/FAIcon.vue');

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Convert String to Date Step Form', () => {
  const runner = new BasicStepFormTestRunner(ToDateStepForm, 'todate');
  runner.testInstantiate();
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'autocompletewidget-stub': 0, 'inputtextwidget-stub': 0 },
    { translator: 'mongo36' },
  );
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'autocompletewidget-stub': 1, 'inputtextwidget-stub': 0 },
    { translator: 'mongo40' },
  );
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'autocompletewidget-stub': 1, 'inputtextwidget-stub': 0 },
    { translator: 'mongo42' },
  );
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'autocompletewidget-stub': 1, 'inputtextwidget-stub': 0 },
    { translator: 'pandas' },
  );

  it('should have 1 inputtext when custom format is selected', () => {
    const wrapper = shallowMount(ToDateStepForm, {
      store: setupMockStore({}),
      localVue,
      propsData: {
        initialStepValue: { name: 'todate', column: '', format: '' },
      },
    });
    const inputtextwidget = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextwidget.length).toEqual(1);
  });

  it('should update editedStep with the selected column at creation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['foo'],
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.vm.$data.editedStep.column).toEqual('foo');
  });

  it('should update editedStep.format properly when a new format is selected', () => {
    const wrapper = shallowMount(ToDateStepForm, {
      store: setupMockStore({}),
      localVue,
    });
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: 'guess', label: '%Y-%m', example: '' });
    expect(wrapper.vm.$data.editedStep.format).toBeUndefined();
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: 'custom', label: '%Y-%m', example: '' });
    expect(wrapper.vm.$data.editedStep.format).toEqual('');
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: '%Y-%m', label: '%Y-%m', example: '1970-12' });
    expect(wrapper.vm.$data.editedStep.format).toEqual('%Y-%m');
  });

  it('should toggle custom format input correctly when switching selected format', () => {
    const wrapper = shallowMount(ToDateStepForm, {
      store: setupMockStore({}),
      localVue,
    });
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: 'guess', label: '%Y-%m', example: '' });
    expect(wrapper.find('.customFormat').exists()).toBe(false);
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: 'custom', label: '%Y-%m', example: '' });
    expect(wrapper.find('.customFormat').exists()).toBe(true);
    wrapper
      .find('autocompletewidget-stub')
      .vm.$emit('input', { format: '%Y-%m', label: '%Y-%m', example: '1970-12' });
    expect(wrapper.find('.customFormat').exists()).toBe(false);
  });

  describe('when user delete content of custom format input', () => {
    it('should return empty string as format', () => {
      const wrapper = shallowMount(ToDateStepForm, {
        store: setupMockStore({}),
        localVue,
        propsData: {
          initialStepValue: { name: 'todate', format: '%Y %m %d %d', column: 'wdc' },
        },
      });
      wrapper.find('.customFormat').vm.$emit('input', undefined); // fake remove input content
      expect(wrapper.vm.$data.editedStep.format).toEqual('');
      expect(wrapper.find('.format').vm.$props.value.format).toEqual('custom');
    });
  });

  describe('on init', () => {
    let wrapper: Wrapper<ToDateStepForm>;
    const createWrapper = (format?: string) => {
      if (wrapper) wrapper.destroy();
      wrapper = shallowMount(ToDateStepForm, {
        store: setupMockStore({}),
        localVue,
        propsData: {
          initialStepValue: { name: 'todate', column: '', format },
        },
      });
    };
    it('should pass down the right value to autocomplete', () => {
      createWrapper();
      expect(wrapper.find('.format').vm.$props.value.format).toEqual('guess');
      createWrapper('');
      expect(wrapper.find('.format').vm.$props.value.format).toEqual('custom');
      createWrapper('%Y-%m');
      expect(wrapper.find('.format').vm.$props.value.format).toEqual('%Y-%m');
    });
  });
});
