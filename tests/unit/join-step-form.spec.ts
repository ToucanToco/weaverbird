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

  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  describe('ListWidget', () => {
    it('should instantiate an autocomplete widget with proper options from the store', () => {
      const initialState = {
        currentPipelineName: 'my_dataset',
        pipelines: {
          my_dataset: [{ name: 'domain', domain: 'my_data' }],
          dataset1: [{ name: 'domain', domain: 'domain1' }],
          dataset2: [{ name: 'domain', domain: 'domain2' }],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselect = wrapper.find('autocompletewidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('dataset1,dataset2');
    });

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
  });
});
