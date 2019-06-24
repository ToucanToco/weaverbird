import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import WidgetMultiSelect from '@/components/stepforms/WidgetInputText.vue';

describe('Widget Multiselect', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetMultiSelect);

    expect(wrapper.exists()).to.be.true;
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).to.equal('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.placeholder).to.equal('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.placeholder).to.equal('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(WidgetMultiSelect);
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.value).to.equal('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.value).to.equal('foo');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        value: ['Foo'],
      },
    });
    const inputWrapper = wrapper.find('input[type="text"]');
    (inputWrapper.element as HTMLInputElement).value = 'Bar';
    inputWrapper.trigger('input', { value: 'Bar' });
    expect(wrapper.emitted()).to.eql({ input: [['Bar']] });
  });
});
