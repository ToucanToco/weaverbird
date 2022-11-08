import { describe, expect, it, vi } from 'vitest';

import AppendStepForm from '@/components/stepforms/AppendStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Append Step Form', () => {
  const runner = new BasicStepFormTestRunner(AppendStepForm, 'append');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ keyword: 'minItems', dataPath: '.pipelines' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'append', pipelines: ['dataset1', 'dataset2'] },
    },
  });

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
      ],
    },
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex();

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const initialState = {
      currentPipelineName: 'my_dataset',
      pipelines: {
        my_dataset: [{ name: 'domain', domain: 'my_data' }],
        dataset1: [{ name: 'domain', domain: 'my_dataset' }],
        dataset2: [{ name: 'domain', domain: 'domain2' }],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.props('options')).toEqual([
      {
        $isDisabled: true,
        trackBy: 'dataset1',
        tooltip:
          'Circular reference: you cannot combine dataset1 because it references the current dataset.',
        label: 'dataset1',
      },
      { trackBy: 'dataset2', label: 'dataset2' },
    ]);
    expect(widgetMultiselect.props('trackBy')).toEqual('trackBy');
    expect(widgetMultiselect.props('label')).toEqual('label');
  });
});
