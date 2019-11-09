import { shallowMount } from '@vue/test-utils';
import FormWidget from '@/components/stepforms/widgets/FormWidget.vue';
import { Component, Mixins } from 'vue-property-decorator';

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
        errors: [{
          dataPath: '.column',
          message: 'test error'
        }]
      }
    });
    expect((wrapper.vm as any).messageError).toEqual('test error');
  });

  it('should return correctly messageError with others messageError', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [{
          dataPath: '.column',
          message: 'test error'
        },
        {
          dataPath: '.condition',
          message: 'Message error condition is missing'
        },
        {
          dataPath: '.column',
          message: 'test error'
        }]
      }
    });
    expect((wrapper.vm as any).messageError).toEqual('Message error condition is missing');
  });

  it('should return classname "field--error: true" in case of error', () => {
    const wrapper = shallowMount(FakeWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [{
          dataPath: '.condition',
          message: 'test error'
        }]
      }
    });
    expect((wrapper.vm as any).toggleClassError).toEqual({"field--error": true});
  });
});
