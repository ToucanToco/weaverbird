import type { Wrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Filter Step Form', () => {
  const runner = new BasicStepFormTestRunner(FilterStepForm, 'filter');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'FilterEditor-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      props: {
        propsData: {
          columnTypes: { foo: 'string' },
        },
      },
      data: {
        editedStep: {
          name: 'filter',
          condition: { column: '', operator: 'eq', value: '' },
        },
      },
      errors: [
        { keyword: 'if', dataPath: '.condition' },
        { keyword: 'minLength', dataPath: '.condition.column' },
      ],
    },
  ]);

  runner.testValidate({
    props: {
      columnTypes: { foo: 'string' },
      initialStepValue: {
        name: 'filter',
        condition: {
          and: [
            { column: 'foo', value: 'bar', operator: 'gt' },
            { column: 'foo', value: ['bar', 'toto'], operator: 'nin' },
          ],
        },
      },
    },
  });

  runner.testCancel();
  

  describe('FilterEditor', () => {
    let wrapper: Wrapper<FilterStepForm>;

    beforeEach(async () => {
      wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { foo: 'string' },
        },
        data: {
          editedStep: {
            name: 'filter',
            condition: { column: 'foo', value: 'bar', operator: 'gt' },
          },
        },
      });
      await wrapper.vm.$nextTick();
    });

    it('should pass down the "filter-tree" prop to the FilterEditor value prop', () => {
      expect(wrapper.find('FilterEditor-stub').props().filterTree).toEqual({
        column: 'foo',
        value: 'bar',
        operator: 'gt',
      });
    });

    it('should pass down the columnTypes to the FilterEditor', () => {
      expect(wrapper.find('FilterEditor-stub').props().columnTypes).toStrictEqual({
        foo: 'string',
      });
    });
  });

  it('should update editedStep with the new filter tree', () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'filter',
          condition: { column: 'foo', value: 'bar', operator: 'gt' },
        },
      },
    });
    (wrapper.vm as any).updateFilterTree({
      and: [
        { column: 'foo', value: 'bar', operator: 'gt' },
        { column: 'toto', value: 'tata', operator: 'eq' },
      ],
    });
    expect(wrapper.vm.$data.editedStep).toEqual({
      name: 'filter',
      condition: {
        and: [
          { column: 'foo', value: 'bar', operator: 'gt' },
          { column: 'toto', value: 'tata', operator: 'eq' },
        ],
      },
    });
  });

  it('should use selected column at creation', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { foo: 'string', bar: 'string' },
        selectedColumns: ['bar'],
      },
    });
    expect(wrapper.vm.$data.editedStep.condition.column).toEqual('bar');
  });

  it('should have no default column if no selected column', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { foo: 'string', bar: 'string' },
      },
    });
    expect(wrapper.vm.$data.editedStep.condition.column).toEqual('');
  });

  it('should not use selected column on edition', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { foo: 'string', bar: 'string' },
        selectedColumns: ['bar'],
        isStepCreation: false,
        initialStepValue: {
          name: 'filter',
          condition: { column: 'foo', value: 'bar', operator: 'gt' },
        },
      },
    });
    // we're editing an existing step with column `foo`, therefore even if the
    // column `bar` is selected in the interface, the step column should remain
    // `foo`.
    expect(wrapper.vm.$data.editedStep.condition.column).toEqual('foo');
  });

  it('should not raise errors with undefined or empty value', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { columnA: 'boolean' },
        initialStepValue: {
          name: 'filter',
          condition: { column: 'columnA', operator: 'eq', value: '' },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted().formSaved).toEqual([
      [
        {
          name: 'filter',
          condition: { column: 'columnA', operator: 'eq', value: '' },
        },
      ],
    ]);
  });
});
