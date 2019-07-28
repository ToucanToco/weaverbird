import { shallowMount, createLocalVue } from '@vue/test-utils';
import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget MultisInputText', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a label', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: {
        value: ['foo'],
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: ['foo'],
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: { value: ['foo'] },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).toEqual('foo');
  });

  it('should update "options" on search-change event', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    const multiselect = wrapper.find('multiselect-stub');
    multiselect.vm.$emit('search-change', 'Foo');
    expect(wrapper.vm.$data.options).toEqual(['Foo']);
  });

  it('should emit "input" event on editedValue update', async () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    await wrapper.setData({ editedValue: ['Foo'] });
    expect(wrapper.emitted()).toEqual({ input: [[['Foo']]] });
  });

  it('should clear "options" on input', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    wrapper.setData({ options: ['Foo'] });
    expect(wrapper.vm.$data.options).toEqual(['Foo']);
    wrapper.find('multiselect-stub').vm.$emit('input');
    expect(wrapper.vm.$data.options).toEqual([]);
  });

  it('should set "editedValue" initially"', async () => {
    const wrapper = shallowMount(MultiInputTextWidget, { propsData: { value: ['Foo'] } });
    expect(wrapper.vm.$data.editedValue).toEqual(['Foo']);
  });
});
