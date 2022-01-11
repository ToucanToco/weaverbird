import DateExtractStepForm from '@/components/stepforms/DateExtractStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('DateExtract Step Form', () => {
  const runner = new BasicStepFormTestRunner(DateExtractStepForm, 'dateextract');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'multiselectwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      props: {
        initialStepValue: {
          name: 'dateextract',
          column: '',
          dateInfo: ['oopsie'],
          newColumns: ['test'],
        },
      },
      errors: [
        {
          keyword: 'minLength',
          dataPath: '.column',
        },
        {
          keyword: 'enum',
          dataPath: '.dateInfo[0]',
        },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'date' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null], [null]],
      },
    }),
    props: {
      initialStepValue: {
        name: 'dateextract',
        column: 'foo',
        dateInfo: ['year', 'month'],
        newColumns: ['foo_year', 'foo_month'],
      },
    },
  });

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['tic', 'tac']] },
      ],
    },
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex();

  it('should pass down the right value to Multiselect', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'dateextract',
            column: 'foo',
            dateInfo: ['year', 'month', 'day'],
            newColumns: ['foo_year', 'foo_month', 'foo_day'],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual([
      { info: 'year', label: 'year' },
      { info: 'month', label: 'month' },
      { info: 'day', label: 'day of month' },
    ]);
  });

  it('should update editedStep when Multiselect is updated', async () => {
    const wrapper = runner.shallowMount({});
    await wrapper.vm.$nextTick();
    wrapper.find('multiselectwidget-stub').vm.$emit('input', [
      { info: 'year', label: 'year' },
      { info: 'month', label: 'month' },
      { info: 'day', label: 'day of month' },
    ]);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.dateInfo).toEqual(['year', 'month', 'day']);
  });

  it('should convert editedStep from old configurations to new configuration', () => {
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: {
            name: 'dateextract',
            column: 'foo',
            operation: 'day',
            new_column_name: 'bar',
          },
        },
      },
    );
    expect(wrapper.vm.$data.editedStep.dateInfo).toEqual(['day']);
    expect(wrapper.vm.$data.editedStep.newColumns).toEqual(['bar']);
    expect(wrapper.vm.$data.editedStep.operation).toBeUndefined();
    expect(wrapper.vm.$data.editedStep.new_column_name).toBeUndefined();
  });

  it('should set newColumns automatically at submit', () => {
    const initialState = { dataset: { headers: [{ name: 'foo_day', type: 'number' }] } };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'dateextract',
          column: 'foo',
          dateInfo: ['year', 'month', 'day'],
          newColumns: [],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.newColumns).toEqual(['foo_year', 'foo_month', 'foo_day1']);
  });
});
