import { shallowMount } from '@vue/test-utils';

import ConditionForm from '@/components/stepforms/ConditionsEditor/ConditionForm.vue';

describe('ConditionForm', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ConditionForm);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should emit "conditionUpdated" event with the right args', async () => {
    const wrapper = shallowMount(ConditionForm, {
      propsData: {
        condition: { column: '', operator: 'eq', value: '' },
      },
    });
    wrapper.find('.condition-form__input--column').setValue('my_col');
    expect(wrapper.emitted().conditionUpdated).toBeDefined();
    expect(wrapper.emitted().conditionUpdated[0]).toEqual([
      { column: 'my_col', operator: 'eq', value: '' },
    ]);
  });
});
