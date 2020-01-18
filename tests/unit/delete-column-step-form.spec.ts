import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import DeleteColumnStepForm from '@/components/stepforms/DeleteColumnStepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { setupMockStore, BasicStepFormTestRunner } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Delete Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(DeleteColumnStepForm, 'delete', localVue);
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
      initialStepValue: { name: 'delete', columns: ['foo'] },
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
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(DeleteColumnStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('multiselectwidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(DeleteColumnStepForm, {
      propsData: {
        initialValue: {
          columns: ['columnA'],
        },
      },
      store,
      localVue,
    });
    wrapper.setData({ editedStep: { columns: ['columnB'] } });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(store.state.vqb.selectedColumns).toEqual(['columnB']);
  });
});
