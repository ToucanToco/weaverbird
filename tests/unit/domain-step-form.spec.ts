import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';

import DomainStepForm from '@/components/stepforms/DomainStepForm.vue';

import { setupMockStore, BasicStepFormTestRunner } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Domain Step Form', () => {
  const runner = new BasicStepFormTestRunner(DomainStepForm, 'domain', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'autocompletewidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ dataPath: '.domain', keyword: 'minLength' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'domain', domain: 'foo' },
    },
  });

  runner.testCancel();

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      domains: ['foo', 'bar'],
    });
    const wrapper = shallowMount(DomainStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('autocompletewidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('foo,bar');
  });
});
