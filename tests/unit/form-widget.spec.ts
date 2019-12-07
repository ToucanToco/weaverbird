import { shallowMount } from '@vue/test-utils';
import { Component, Mixins } from 'vue-property-decorator';

import FormWidget from '@/components/stepforms/widgets/FormWidget.vue';

/* Fake widget use to manage the mixins render issue */
@Component({
  name: 'fake-widget',
})
export default class FakeWidget extends Mixins(FormWidget) {
  render() {
    // empty render to manager the mixins render issue
  }
}

describe('Form widget', () => {
  it('should return correctly messageError', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.column',
        errors: [
          {
            dataPath: '.column',
            message: 'test error',
          },
        ],
      },
    });
    expect((wrapper.vm as any).messageError).toEqual('test error');
  });

  it('should return correctly messageError with others messageError', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [
          {
            dataPath: '.column',
            message: 'test error',
          },
          {
            dataPath: '.condition',
            message: 'Message error condition is missing',
          },
          {
            dataPath: '.column',
            message: 'test error',
          },
        ],
      },
    });
    expect((wrapper.vm as any).messageError).toEqual('Message error condition is missing');
  });

  it('should return classname "field--error: true" in case of error and no warning', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [
          {
            dataPath: '.condition',
            message: 'test error',
          },
        ],
      },
    });
    expect((wrapper.vm as any).toggleClassErrorWarning).toEqual({
      'field--error': true,
      'field--warning': false,
    });
  });

  it('should return classname "field--error: true" and "field--warning: false" in case of error and warning', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [
          {
            dataPath: '.condition',
            message: 'test error',
          },
        ],
        warning: 'warning',
      },
    });
    expect((wrapper.vm as any).toggleClassErrorWarning).toEqual({
      'field--error': true,
      'field--warning': false,
    });
  });

  it('should return classname "field--error: false" and "field--warning: true" \
  in case of warning and no error', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect((wrapper.vm as any).toggleClassErrorWarning).toEqual({
      'field--error': false,
      'field--warning': true,
    });
  });
});
