import { describe, expect, it, vi } from 'vitest';

import JoinStepForm from '@/components/stepforms/JoinStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('join Step Form', () => {
  const runner = new BasicStepFormTestRunner(JoinStepForm, 'join');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'autocompletewidget-stub': 2,
    'listwidget-stub': 1,
  });

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'join',
        rightPipeline: { type: 'ref', uid: '1' },
        type: 'left',
        on: [['foo', 'bar']],
      },
    },
  });

  runner.testCancel();
  

  describe('right dataset', () => {
    it('should instantiate an autocomplete widget with proper options from the store', () => {
      const wrapper = runner.shallowMount({
        propsData: {
          availableDomains: [
            { name: 'dataset1', uid: '1' },
            { name: 'dataset2', uid: '2' },
          ],
          unjoinableDomains: [{ name: 'dataset2', uid: '2' }],
        },
      });
      const widgetMultiselect = wrapper.find('autocompletewidget-stub');
      expect(widgetMultiselect.props('options')).toEqual([
        { trackBy: { type: 'ref', uid: '1' }, label: 'dataset1' },
        {
          trackBy: { type: 'ref', uid: '2' },
          label: 'dataset2',
          disabled: true,
          tooltip: 'This dataset cannot be combined with the actual one',
        },
      ]);
      expect(widgetMultiselect.props('withExample')).toEqual(true);
      expect(widgetMultiselect.props('trackBy')).toEqual('trackBy');
      expect(widgetMultiselect.props('label')).toEqual('label');
    });
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
          name: 'join',
          rightPipeline: { type: 'ref', uid: '1' },
          type: 'left',
          on: [['foo', 'bar']],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('autocompletewidget-stub').props().value).toStrictEqual({
      label: 'dataset1',
      trackBy: { type: 'ref', uid: '1' },
    });
  });

  describe('column names', () => {
    it('should pass down the "joinColumns" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount({
        data: {
          editedStep: {
            name: 'join',
            rightPipeline: 'pipeline_right',
            type: 'left',
            on: [['foo', 'bar']],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
    });

    it('should get the right data "on" when editedStep.on is empty', async () => {
      const wrapper = runner.shallowMount({
        data: {
          editedStep: {
            name: 'join',
            rightPipeline: 'pipeline_right',
            type: 'left',
            on: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
    });

    it('should update the edited step when one of the subcomponents emits an updated value', () => {
      const wrapper = runner.shallowMount({
        data: {
          editedStep: {
            name: 'join',
            rightPipeline: 'pipeline_right',
            type: 'left',
            on: [],
          },
        },
      });
      wrapper.find('listwidget-stub').vm.$emit('input', ['colRight', 'colLeft']);
      expect(wrapper.vm.$data.editedStep.on).toEqual(['colRight', 'colLeft']);
    });

    it('should fetch the right dataset columns when editing an existing step', () => {
      runner.shallowMount({
        propsData: {
          initialStepValue: {
            name: 'join',
            rightPipeline: 'pipeline_right',
            type: 'left',
            on: ['left_col', 'right_col'],
          },
        },
      });
      // Unfortunately, we can't easily mock the getColumnNamesFromPipeline action for now.
      // So this test has no assertion.
    });
  });
});
