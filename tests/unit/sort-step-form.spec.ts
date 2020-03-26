import SortStepForm from '@/components/stepforms/SortStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Sort Step Form', () => {
  const runner = new BasicStepFormTestRunner(SortStepForm, 'sort');
  runner.testInstantiate();
  runner.testExpectedComponents({ 'listwidget-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'a column parameter is an empty string',
      data: {
        editedStep: {
          name: 'sort',
          columns: [{ column: '', order: 'desc' }],
        },
      },
      errors: [{ keyword: 'minLength', dataPath: '.columns[0].column' }],
    },
  ]);

  runner.testValidate(
    {
      testlabel: 'submitted data is valid',
      data: {
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      },
    },
    {
      name: 'sort',
      columns: [{ column: 'amazing', order: 'desc' }],
    },
  );

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
        { name: 'rename', oldname: 'tic', newname: 'tac' },
      ],
    },
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex();

  it('should suggest the selected column as the column to be sorted', function() {
    const wrapper = runner.shallowMount({
      selectedColumns: ['selectedColumn'],
    });
    expect(wrapper.find('listwidget-stub').props().value).toEqual([
      { column: 'selectedColumn', order: 'asc' },
    ]);
  });

  it('should not suggest a column to be sorted if no column is selected', function() {
    const wrapper = runner.shallowMount({});
    expect(wrapper.find('listwidget-stub').props().value).toEqual([{ column: '', order: 'asc' }]);
  });

  it('should not suggest a column to be sorted if the step has already been edited', function() {
    const wrapper = runner.shallowMount(
      { selectedColumns: ['selectedColumn'] },
      {
        propsData: {
          initialStepValue: {
            name: 'sort',
            columns: [{ column: 'amazing', order: 'desc' }],
          },
        },
      },
    );
    expect(wrapper.find('listwidget-stub').props().value).toEqual([
      { column: 'amazing', order: 'desc' },
    ]);
  });

  it('should pass right sort props to widgetList sort column', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'sort',
            columns: [{ column: 'amazing', order: 'desc' }],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('listwidget-stub').props().value).toEqual([
      { column: 'amazing', order: 'desc' },
    ]);
  });

  it('should update the editedStep when the list is updated', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'sort',
            columns: [{ column: 'amazing', order: 'desc' }],
          },
        },
      },
    );
    wrapper.find('listwidget-stub').vm.$emit('input', [{ column: 'amazing', order: 'desc' }]);
    expect(wrapper.vm.$data.editedStep.columns).toEqual([{ column: 'amazing', order: 'desc' }]);
  });
});
