import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Unpivot Step Form', () => {
  const runner = new BasicStepFormTestRunner(UnpivotStepForm, 'unpivot');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 2,
    'checkboxwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'fields are missing',
      errors: [
        { keyword: 'minItems', dataPath: '.keep' },
        { keyword: 'minItems', dataPath: '.unpivot' },
      ],
    },
  ]);

  runner.testValidate(
    {
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'unpivot',
          keep: ['columnA', 'columnB'],
          unpivot: ['columnC'],
          dropna: true,
        },
      },
    },
    {
      name: 'unpivot',
      keep: ['columnA', 'columnB'],
      unpivot: ['columnC'],
      unpivot_column_name: 'variable',
      value_column_name: 'value',
      dropna: true,
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

  it('should pass down props to widgets', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'unpivot',
          keep: ['foo', 'bar'],
          unpivot: ['baz'],
          unpivot_column_name: 'spam',
          value_column_name: 'eggs',
          dropna: false,
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#keepColumnInput').props('value')).toEqual(['foo', 'bar']);
    expect(wrapper.find('#unpivotColumnInput').props('value')).toEqual(['baz']);
    const widgetCheckbox = wrapper.find(CheckboxWidget);
    expect(widgetCheckbox.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.find('#keepColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('#unpivotColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });
});
