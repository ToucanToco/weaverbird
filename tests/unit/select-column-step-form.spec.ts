import SelectColumnStepForm from '@/components/stepforms/SelectColumnStepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Select Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(SelectColumnStepForm, 'select');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ keyword: 'minItems', dataPath: '.columns' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'select', columns: ['foo'] },
    },
  });

  runner.testCancel();
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
    });
    wrapper.setData({ editedStep: { columns: ['columnB'] } });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['columnB']);
  });
});
