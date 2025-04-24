import { describe, expect, it, vi } from 'vitest';

import DateGranularityStepForm from '@/components/stepforms/DateGranularityStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('DateGranularity Step Form', () => {
  const runner = new BasicStepFormTestRunner(DateGranularityStepForm, 'dategranularity');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'AutocompleteWidget-stub': 1,
    'inputtextwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      props: {
        initialStepValue: {
          name: 'dategranularity',
          column: '',
          granularity: '',
          newColumn: undefined,
        },
      },
      errors: [
        {
          dataPath: '.column',
          keyword: 'minLength',
        },
        {
          dataPath: '.granularity',
          keyword: 'pattern',
        },
        {
          dataPath: '.granularity',
          keyword: 'pattern',
        },
        {
          dataPath: '.granularity',
          keyword: 'enum',
        },
        {
          dataPath: '.granularity',
          keyword: 'oneOf',
        },
        {
          dataPath: '.granularity',
          keyword: 'minLength',
        },
      ],
    },
  ]);

  runner.testValidationErrors([
    {
      testlabel: 'submitted granularity is not valid',
      props: {
        initialStepValue: {
          name: 'dategranularity',
          column: 'date',
          granularity: '% invalid var or input %',
        },
      },
      errors: [
        {
          dataPath: '.granularity',
          keyword: 'pattern',
        },
        {
          dataPath: '.granularity',
          keyword: 'pattern',
        },
        {
          dataPath: '.granularity',
          keyword: 'enum',
        },
        {
          dataPath: '.granularity',
          keyword: 'oneOf',
        },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid with front-end var',
    props: {
      columnTypes: { foo: 'date', bar: 'string' },
      initialStepValue: {
        name: 'dategranularity',
        column: 'foo',
        granularity: '<%=somevar%>',
        newColumn: 'foo_year',
      },
    },
  });

  runner.testValidate({
    testlabel: 'submitted data is valid with back-end var',
    props: {
      columnTypes: { foo: 'date', bar: 'string' },
      initialStepValue: {
        name: 'dategranularity',
        column: 'foo',
        granularity: '{{ user.attribute.something }}',
        newColumn: 'foo_year',
      },
    },
  });

  runner.testValidate({
    testlabel: 'submitted data is valid with enum',
    props: {
      columnTypes: { foo: 'date', bar: 'string' },
      initialStepValue: {
        name: 'dategranularity',
        column: 'foo',
        granularity: 'year',
        newColumn: 'foo_year',
      },
    },
  });

  runner.testCancel();

  it('should pass down the right value to Autocomplete', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'dategranularity',
          column: 'foo',
          granularity: 'year',
          newColumn: 'foo_year',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('AutocompleteWidget-stub').props('value')).toEqual('year');
  });

  it('should update editedStep when Autocomplete is updated', async () => {
    const wrapper = runner.shallowMount({});
    await wrapper.vm.$nextTick();
    wrapper.find('AutocompleteWidget-stub').vm.$emit('input', 'year');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.granularity).toEqual('year');
  });
});
