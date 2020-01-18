import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import AppendStepForm from '@/components/stepforms/AppendStepForm.vue';

import { setupMockStore, BasicStepFormTestRunner } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Append Step Form', () => {
  const runner = new BasicStepFormTestRunner(AppendStepForm, 'append', localVue);
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
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ],
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const store = setupMockStore({
      currentPipelineName: 'my_dataset',
      pipelines: {
        my_dataset: [{ name: 'domain', domain: 'my_data' }],
        dataset1: [{ name: 'domain', domain: 'domain1' }],
        dataset2: [{ name: 'domain', domain: 'domain2' }],
      },
    });
    const wrapper = shallowMount(AppendStepForm, { store, localVue });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.attributes('options')).toEqual('dataset1,dataset2');
  });
});
