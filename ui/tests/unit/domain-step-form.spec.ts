import { describe, expect, it, vi } from 'vitest';

import DomainStepForm from '@/components/stepforms/DomainStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Domain Step Form', () => {
  const runner = new BasicStepFormTestRunner(DomainStepForm, 'domain');
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
    const wrapper = runner.shallowMount({
      propsData: {
        availableDomains: [
          { name: 'bar', uid: 'bar' },
          { name: 'foo', uid: 'foo' },
        ],
      },
    });
    const widgetAutocomplete = wrapper.find('autocompletewidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('bar,foo');
  });
});
