import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import WidgetMultiInputText from '@/components/stepforms/WidgetMultiInputText.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget MultisInputText', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    expect(wrapper.exists()).to.be.true;
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetMultiInputText, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).to.equal('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(WidgetMultiInputText, {
      propsData: {
        value: 'foo',
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).to.equal('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(WidgetMultiInputText, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).to.equal('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).to.equal('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(WidgetMultiInputText, {
      propsData: { value: 'foo' },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).to.equal('foo');
  });

  it('should update "options" on search-change event', () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    const multiselect = wrapper.find('multiselect-stub');
    multiselect.vm.$emit('search-change', 'Foo');
    expect(wrapper.vm.$data.options).to.eql(['Foo']);
  });

  it('should emit "input" event on editedValue update', async () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    await wrapper.setData({ editedValue: ['Foo'] });
    expect(wrapper.emitted()).to.eql({ input: [[['Foo']]] });
  });

  it('should clear "options" on input', () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    wrapper.setData({ options: ['Foo'] });
    expect(wrapper.vm.$data.options).to.eql(['Foo']);
    wrapper.find('multiselect-stub').vm.$emit('input');
    expect(wrapper.vm.$data.options).to.eql([]);
  });

  it('should update "editedValue" when "value is change"', async () => {
    const wrapper = shallowMount(WidgetMultiInputText);
    await wrapper.setData({ value: ['Foo'] });
    expect(wrapper.vm.$data.editedValue).to.eql(['Foo']);
  });
});
