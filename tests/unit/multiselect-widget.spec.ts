import { mount } from '@vue/test-utils';

import MultiSelectWidget from '@/components/stepforms/widgets/Multiselect.vue';

describe('Widget Multiselect', () => {
  it('should not have specific templates if the prop withExample is false', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: { withExample: false, options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeFalsy();
    expect(wrapper.find('.option__container').exists()).toBeFalsy();
  });

  it('should have specific templates if the prop withExample is true', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: { withExample: true, options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
  });

  it('should add a tooltip to the option', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        withExample: true,
        options: [{ label: 'foo', example: 'bar', tooltip: 'ukulélé' }],
      },
    });
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').attributes('title')).toEqual('ukulélé');
  });
});
