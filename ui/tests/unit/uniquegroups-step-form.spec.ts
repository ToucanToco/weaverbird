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
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: { editedStep: { name: 'uniquegroups', on: ['foo', 'bar'] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const wrapper = runner.mount(undefined, {
        data: { editedStep: { name: 'uniquegroups', on: ['foo'] } },
      });
      const store = runner.getStore();
      await wrapper.vm.$nextTick();
      expect(store.selectedColumns).toEqual(['foo']);
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
  runner.testResetSelectedIndex();

  it('should change the column focus after input in multiselect', async () => {
    const initialState = { selectedColumns: [] };
    const wrapper = runner.mount(initialState, {
      data: { editedStep: { name: 'uniquegroups', on: ['foo'] } },
    });
    const store = runner.getStore();
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(store.selectedColumns).toEqual(['foo']);
  });
});
