import { shallowMount } from '@vue/test-utils';

import ConditionForm from '@/components/stepforms/ConditionsEditor/ConditionForm.vue';

describe('ConditionForm', () => {
  jest.useFakeTimers();

  it('should instantiate', () => {
    const wrapper = shallowMount(ConditionForm);
    expect(wrapper.exists()).toBeTruthy();
  });

  it.skip('should emit "conditionUpdated" event with the right args', async () => {
    const wrapper = shallowMount(ConditionForm, {
      propsData: {
        condition: { column: '', comparison: 'eq', value: ''}
      },
    });
    wrapper.find('.condition-form__input--column').setValue('my_col');
    jest.advanceTimersByTime(5000);
    expect(wrapper.emitted().conditionUpdated).toBeDefined();
    // expect(wrapper.emitted().conditionUpdated[0]).toEqual([
    //   { column: 'my_col', comparison: 'eq', value: ''},
    // ]);
  });
});
