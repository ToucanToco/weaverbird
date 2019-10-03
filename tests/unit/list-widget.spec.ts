import { shallowMount } from '@vue/test-utils';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import AggregationWidget from '@/components/stepforms/widgets/Aggregation.vue';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';

describe('Widget List', () => {
  describe('automatic new field', () => {
    it('it should instantiate', () => {
      const wrapper = shallowMount(ListWidget);

      expect(wrapper.exists()).toBeTruthy();
    });

    it('should have a label', () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          name: 'Label',
        },
      });

      expect(wrapper.find('label').text()).toEqual('Label');
    });

    it('should instantiate a widget-input text', () => {
      const wrapper = shallowMount(ListWidget);
      const widgetInputWrapper = wrapper.find('inputtextwidget-stub');
      expect(widgetInputWrapper.exists()).toBeTruthy();
    });

    it('should instantiate a widget aggregation', () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          widget: AggregationWidget,
          defaultItem: { name: 'foo', value: 'bar' },
        },
      });

      const widgetAggregationtWrapper = wrapper.find('aggregationwidget-stub');
      expect(widgetAggregationtWrapper.exists()).toBeTruthy();
    });

    it('should automatically add an input when filling the first one', async () => {
      const wrapper = shallowMount(ListWidget);
      wrapper.setProps({ value: [{ column: 'foo', aggfunction: 'sum', newcolumn: 'bar' }] });

      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('inputtextwidget-stub').length).toEqual(2);
    });

    it('should add trash icons after first input', async () => {
      const wrapper = shallowMount(ListWidget);
      expect(wrapper.findAll('.widget-list__icon').length).toEqual(0);
      wrapper.setProps({ value: [{ column: 'foo', aggfunction: 'sum', newcolumn: 'bar' }] });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('.widget-list__icon').length).toEqual(2);
    });

    it('should remove first input when clickng on trash', async () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          value: [{ column: 'foo', aggfunction: 'sum', newcolumn: 'bar' }],
        },
      });
      const trashWrapper = wrapper.find('.widget-list__icon');
      trashWrapper.trigger('click');
      expect(wrapper.emitted()['input']).toBeDefined();
    });
  });

  describe('not automatic new field', () => {
    it('should have a button to add a new field', () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
          addFieldName: 'Add aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');

      expect(addButtonWrapper.exists()).toBeTruthy();
      expect(addButtonWrapper.text()).toEqual('Add aggregation');
    });

    it('should add a new field when clicking on the button "Add Aggregation"', () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');
      addButtonWrapper.trigger('click');

      expect(wrapper.emitted()['input']).toBeDefined();
      expect(wrapper.emitted()['input'][0][0][0]).toEqual('');
    });

    it('should not share the same "default item" reference among list items', () => {
      const wrapper = shallowMount(ListWidget, {
        propsData: {
          automaticNewField: false,
          widget: FilterSimpleConditionWidget,
          defaultItem: { column: '', value: '', operator: 'eq' },
          name: 'Aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');
      addButtonWrapper.trigger('click');
      // 1. get back the emitted object
      const emitted = wrapper.emitted()['input'][0][0][0];
      expect(emitted).toEqual({
        column: '',
        value: '',
        operator: 'eq',
      });
      // 2. modify it, next clicks should still the original item
      emitted.value = '1';
      addButtonWrapper.trigger('click');
      expect(wrapper.emitted()['input'][1][0][0]).toEqual({
        column: '',
        value: '',
        operator: 'eq',
      });
    });
  });
});
