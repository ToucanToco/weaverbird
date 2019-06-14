import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import WidgetList from '@/components/WidgetList.vue';

describe('Widget List', function() {
  describe('automatic new field', function() {
    it('it should instantiate', function() {
      const wrapper = shallowMount(WidgetList);

      expect(wrapper.exists()).to.be.true;
    });

    it('should have a label', function() {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          name: 'Label',
        },
      });

      expect(wrapper.find('label').text()).to.equal('Label');
    });

    it('should instantiate a widget-input text', function() {
      const wrapper = shallowMount(WidgetList);
      const widgetInputWrapper = wrapper.find('widget-input-text-stub');

      expect(widgetInputWrapper.exists()).to.be.true;
    });

    it('should instantiate a widget aggregation', function() {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          widget: 'widget-aggregation',
        },
      });

      const widgetAggregationtWrapper = wrapper.find('widget-aggregation-stub');
      expect(widgetAggregationtWrapper.exists()).to.be.true;
    });

    it('should automatically add an input when filling the first one', async function() {
      const wrapper = shallowMount(WidgetList);
      wrapper.setProps({ value: ['columnName'] });

      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('widget-input-text-stub').length).to.equal(2);
    });

    it('should add only a trash on the first input', async function() {
      const wrapper = shallowMount(WidgetList);
      wrapper.setProps({ value: ['columnName'] });

      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('.widget-list__icon').length).to.eql(1);
    });

    it('should remove first input when clickng on trash', async function() {
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

  describe('not automatic new field', function() {
    it('should have a button to add a new field', function() {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');

      expect(addButtonWrapper.exists()).to.be.true;
      expect(addButtonWrapper.text()).to.equal('Add Aggregation');
    });

    it.only('should add a new fill when clicking on the button "Add Aggregation"', function() {
      const wrapper = shallowMount(WidgetList, {
        propsData: {
          automaticNewField: false,
          name: 'Aggregation',
        },
      });
      const addButtonWrapper = wrapper.find('button');
      addButtonWrapper.trigger('click');

      expect(wrapper.emitted()['input']).to.exist;
      expect(wrapper.emitted()['input'][0][0][0]).to.eql({});
    });
  });
});
