import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import WidgetList from '@/components/stepforms/WidgetList.vue';

describe('Widget List', () => {
  describe('automatic new field', () => {
    it('it should instantiate', () => {
      const wrapper = shallowMount(WidgetList);

      expect(wrapper.exists()).to.be.true;
    });

    it('should have a label', () => {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          name: 'Label',
        },
      });

      expect(wrapper.find('label').text()).to.equal('Label');
    });

    it('should instantiate a widget-input text', () => {
      const wrapper = shallowMount(WidgetList);
      const widgetInputWrapper = wrapper.find('widget-input-text-stub');

      expect(widgetInputWrapper.exists()).to.be.true;
    });

    it('should instantiate a widget aggregation', () => {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          widget: 'widget-aggregation',
        },
      });

      const widgetAggregationtWrapper = wrapper.find('widget-aggregation-stub');
      expect(widgetAggregationtWrapper.exists()).to.be.true;
    });

    it('should automatically add an input when filling the first one', async () => {
      const wrapper = shallowMount(WidgetList);
      wrapper.setProps({ value: ['columnName'] });

      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('widget-input-text-stub').length).to.equal(2);
    });

    it('should add trash icons after first input', async () => {
      const wrapper = shallowMount(WidgetList);
      expect(wrapper.findAll('.widget-list__icon').length).to.eql(0);
      wrapper.setProps({ value: ['columnName'] });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('.widget-list__icon').length).to.eql(2);
    });

    it('should remove first input when clickng on trash', async () => {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          value: ['columnName'],
        },
      });
      const trashWrapper = wrapper.find('.widget-list__icon');
      trashWrapper.trigger('click');
      expect(wrapper.emitted()['input']).to.exist;
    });
  });

  describe('not automatic new field', () => {
    it('should have a button to add a new field', () => {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
          addFieldName: 'Add aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');

      expect(addButtonWrapper.exists()).to.be.true;
      expect(addButtonWrapper.text()).to.equal('Add aggregation');
    });

    it('should add a new field when clicking on the button "Add Aggregation"', () => {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');
      addButtonWrapper.trigger('click');

      expect(wrapper.emitted()['input']).to.exist;
      expect(wrapper.emitted()['input'][0][0][0]).to.equal('');
    });
  });
});
