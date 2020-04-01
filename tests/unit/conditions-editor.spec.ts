import { shallowMount } from '@vue/test-utils';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor.vue';

describe('ConditionsEditor', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ConditionsEditor);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should emit the new conditions tree when the conditions tree is updated', () => {
    const wrapper = shallowMount(ConditionsEditor, {
      propsData: {
        conditionsTree: { column: 'foo', value: 'bar', operator: 'gt' },
      },
    });
    (wrapper.vm as any).updateConditionsTree({
      operator: 'and',
      conditions: [
        {
          column: 'foo',
          value: 'bar',
          operator: 'gt',
        },
        {
          column: 'toto',
          value: 'tata',
          operator: 'eq',
        },
      ],
      groups: [],
    });
    expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
    expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
      {
        operator: 'and',
        conditions: [
          {
            column: 'foo',
            value: 'bar',
            operator: 'gt',
          },
          {
            column: 'toto',
            value: 'tata',
            operator: 'eq',
          },
        ],
        groups: [],
      },
    ]);
  });
});
