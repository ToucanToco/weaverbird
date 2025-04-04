import { describe, expect, it, vi } from 'vitest';

import UniqueGroupsStepForm from '@/components/stepforms/UniqueGroupsStepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('UniqueGroups Step Form', () => {
  const runner = new BasicStepFormTestRunner(UniqueGroupsStepForm, 'uniquegroups');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });

  describe('MultiselectWidget', () => {
    it('should instantiate an MultiselectWidget widget with proper options from the store', () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        },
      });
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount({
        data: { editedStep: { name: 'uniquegroups', on: ['foo', 'bar'] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const wrapper = runner.mount({
        data: { editedStep: { name: 'uniquegroups', on: ['foo'] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'foo' }]]);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"on" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'uniquegroups',
            on: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.on.0' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'uniquegroups',
          on: ['foo'],
        },
      },
    });
  });

  runner.testCancel();

  it('should change the column focus after input in multiselect', async () => {
    const wrapper = runner.mount({
      propsData: { selectedColumns: [] },
      data: { editedStep: { name: 'uniquegroups', on: ['foo'] } },
    });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'foo' }]]);
  });
});
