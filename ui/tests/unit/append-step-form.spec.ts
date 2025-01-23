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

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'append',
        pipelines: [
          { type: 'ref', uid: 'dataset1' },
          { type: 'ref', uid: 'dataset2' },
        ],
      },
    },
  });

  runner.testCancel();

  

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const wrapper = runner.shallowMount({
      propsData: {
        availableDomains: [
          { name: 'dataset1', uid: '1' },
          { name: 'dataset2', uid: '2' },
        ],
        unjoinableDomains: [{ name: 'dataset2', uid: '2' }],
      },
    });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.props('options')).toEqual([
      { trackBy: { type: 'ref', uid: '1' }, label: 'dataset1' },
      {
        trackBy: { type: 'ref', uid: '2' },
        label: 'dataset2',
        disabled: true,
        tooltip: 'This dataset cannot be combined with the actual one',
      },
    ]);
    expect(widgetMultiselect.props('trackBy')).toEqual('trackBy');
    expect(widgetMultiselect.props('label')).toEqual('label');
  });

  it('should handle dataset references', async () => {
    const wrapper = runner.shallowMount({
      propsData: {
        availableDomains: [
          { name: 'dataset1', uid: '1' },
          { name: 'dataset2', uid: '2' },
        ],
        unjoinableDomains: [],
      },
      data: {
        editedStep: {
          name: 'append',
          pipelines: [{ type: 'ref', uid: '1' }],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('multiselectwidget-stub').props().value).toStrictEqual([
      { label: 'dataset1', trackBy: { type: 'ref', uid: '1' } },
    ]);
  });
});
