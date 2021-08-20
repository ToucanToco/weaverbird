import TrimStepForm from '@/components/stepforms/TrimStepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

import { BasicStepFormTestRunner } from './utils';

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

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
      ],
    },
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex();

  it('should instantiate a multiselect widget with proper options from the store', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    const widgetAutocomplete = wrapper.find('multiselectwidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should update selectedColumn when column is changed', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    };
    const wrapper = runner.mount(initialState, {
      propsData: {
        initialValue: {
          columns: ['columnA'],
        },
      },
      data: { editedStep: { columns: ['columnB'] } },
    });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['columnB']);
  });
});
