import { describe, expect, it, vi } from 'vitest';

import TrimStepForm from '@/components/stepforms/TrimStepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Trim Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(TrimStepForm, 'trim');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ dataPath: '.columns', keyword: 'minItems' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'trim', columns: ['foo'] },
    },
  });

  runner.testCancel();

  

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const wrapper = runner.shallowMount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
      },
    });
    const widgetAutocomplete = wrapper.find('multiselectwidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should update selectedColumn when column is changed', async () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        selectedColumns: ['columnA'],
        initialValue: {
          columns: ['columnA'],
        },
      },
      data: { editedStep: { columns: ['columnB'] } },
    });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'columnB' }]]);
  });
});
