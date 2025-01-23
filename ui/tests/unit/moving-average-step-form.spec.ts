import _ from 'lodash';
import { describe, expect, it, vi } from 'vitest';

import MovingAverageStepForm from '@/components/stepforms/MovingAverageStepForm.vue';
import type { ScopeContext } from '@/lib/templating';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Moving Average Step Form', () => {
  const runner = new BasicStepFormTestRunner(MovingAverageStepForm, 'movingaverage');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 2,
    'inputtextwidget-stub': 2,
    'multiselectwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.columnToSort' },
        { keyword: 'minLength', dataPath: '.valueColumn' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'movingaverage',
        valueColumn: 'foo',
        columnToSort: 'bar',
        movingWindow: 42,
        groups: ['test'],
        newColumnName: 'toto',
      },
    },
  });

  runner.testCancel();
  

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'movingaverage',
          valueColumn: 'foo',
          columnToSort: 'bar',
          movingWindow: 42,
          groups: ['test'],
          newColumnName: 'toto',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.valueColumnInput').props('value')).toEqual('foo');
    expect(wrapper.find('.columnToSortInput').props('value')).toEqual('bar');
    expect(wrapper.find('.movingWindowInput').props('value')).toEqual(42);
    expect(wrapper.find('.groupsInput').props('value')).toEqual(['test']);
    expect(wrapper.find('.newColumnNameInput').props('value')).toEqual('toto');
  });

  it('should accept templatable values', async () => {
    function interpolate(s: string, context: ScopeContext) {
      const compiled = _.template(s);
      return compiled(context);
    }
    const wrapper = runner.mount({
      propsData: {
        initialStepValue: {
          name: 'movingaverage',
          valueColumn: 'foo',
          columnToSort: 'bar',
          movingWindow: '<%= movedWidow %>',
          groups: ['test'],
          newColumnName: 'toto',
        },
        variables: {
          movedWidow: 42,
        },
        interpolateFunc: interpolate,
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted().formSaved).toEqual([
      [
        {
          name: 'movingaverage',
          valueColumn: 'foo',
          columnToSort: 'bar',
          movingWindow: '<%= movedWidow %>',
          groups: ['test'],
          newColumnName: 'toto',
        },
      ],
    ]);
  });
});
