import JoinStepForm from '@/components/stepforms/JoinStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('join Step Form', () => {
  const runner = new BasicStepFormTestRunner(JoinStepForm, 'join');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'autocompletewidget-stub': 2,
    'listwidget-stub': 1,
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  describe('AutocompleteWidget', () => {
    it('should instantiate an autocomplete widget with proper options from the store', () => {
      const initialState = {
        currentPipelineName: 'my_dataset',
        pipelines: {
          my_dataset: [{ name: 'domain', domain: 'my_data' }],
          dataset1: [{ name: 'domain', domain: 'my_dataset' }],
          dataset2: [{ name: 'domain', domain: 'domain2' }],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselect = wrapper.find('autocompletewidget-stub');
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
      expect(widgetMultiselect.props('withExample')).toEqual(true);
      expect(widgetMultiselect.props('trackBy')).toEqual('trackBy');
      expect(widgetMultiselect.props('label')).toEqual('label');
    });
  });

  describe('ListWidget', () => {
    it('should pass down the "joinColumns" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'join',
            right_pipeline: 'pipeline_right',
            type: 'left',
            on: [['foo', 'bar']],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
    });

    it('should get the right data "on" when editedStep.on is empty', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'join',
            right_pipeline: 'pipeline_right',
            type: 'left',
            on: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
    });

    it('should update the edited step when one of the subcomponents emits an updated value', () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'join',
            right_pipeline: 'pipeline_right',
            type: 'left',
            on: [],
          },
        },
      });
      wrapper.find('listwidget-stub').vm.$emit('input', ['colRight', 'colLeft']);
      expect(wrapper.vm.$data.editedStep.on).toEqual(['colRight', 'colLeft']);
    });
  });
});
