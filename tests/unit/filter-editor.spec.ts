import { shallowMount } from '@vue/test-utils';

import FilterEditor from '@/components/FilterEditor.vue';

describe('FilterEditor', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(FilterEditor);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should pass the "conditions-tree" prop to ConditionsEditor', async () => {
    const wrapper = shallowMount(FilterEditor, {
      propsData: {
        filterTree: { column: 'foo', value: 'bar', operator: 'gt' },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('ConditionsEditor-stub').props().conditionsTree).toEqual({
      conditions: [{ column: 'foo', operator: 'gt', value: 'bar' }],
      groups: [],
      operator: '',
    });
  });

  it('should emit the new filter tree when conditions tree is updated', () => {
    const wrapper = shallowMount(FilterEditor, {
      propsData: {
        filterTree: { column: 'foo', value: 'bar', operator: 'gt' },
      },
    });
    (wrapper.vm as any).updateFilterTree({
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
    expect(wrapper.emitted().filterTreeUpdated).toBeDefined();
    expect(wrapper.emitted().filterTreeUpdated[0]).toEqual([
      {
        and: [
          { column: 'foo', value: 'bar', operator: 'gt' },
          { column: 'toto', value: 'tata', operator: 'eq' },
        ],
      },
    ]);
  });
});
