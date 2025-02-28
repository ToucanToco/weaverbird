import { describe, expect, it, vi } from 'vitest';

import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

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
      unpivotColumnName: 'variable',
      valueColumnName: 'value',
      dropna: true,
    },
  );

  runner.testCancel();

  it('should pass down props to widgets', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'unpivot',
          keep: ['foo', 'bar'],
          unpivot: ['baz'],
          unpivotColumnName: 'spam',
          valueColumnName: 'eggs',
          dropna: false,
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.keepColumnInput').props('value')).toEqual(['foo', 'bar']);
    expect(wrapper.find('.unpivotColumnInput').props('value')).toEqual(['baz']);
    const widgetCheckbox = wrapper.find(CheckboxWidget);
    expect(widgetCheckbox.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const wrapper = runner.shallowMount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
      },
    });
    expect(wrapper.find('.keepColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('.unpivotColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });
});
