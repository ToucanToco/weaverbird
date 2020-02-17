import SortStepForm from '@/components/stepforms/SortStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Sort Step Form', () => {
  const runner = new BasicStepFormTestRunner(SortStepForm, 'sort');
  runner.testInstantiate();
  runner.testExpectedComponents({ 'listwidget-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'a column parameter is an empty string',
      props: {
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
      testlabel: 'submitted data is validd',
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

  describe('ListWidget', () => {
    it('should pass the defaultSortColumn props to widgetList', async () => {
      const wrapper = runner.shallowMount();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([{ column: '', order: 'asc' }]);
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
  });
});
