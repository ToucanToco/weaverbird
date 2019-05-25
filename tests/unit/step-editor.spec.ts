import { shallowMount } from '@vue/test-utils';
import StepEditor from '@/components/StepEditor.vue';
import { renameStepSchema } from '@/assets/schemas';

describe('Step editor', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(StepEditor);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a rename title', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'rename' },
    });
    expect(wrapper.text()).toEqual('Rename step configuration');
  });

  it('should have a filter title', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'filter' },
    });
    expect(wrapper.text()).toEqual('Filter step configuration');
  });

  it('should have a default title', () => {
    const wrapper = shallowMount(StepEditor);
    expect(wrapper.text()).toEqual('step configuration');
  });

  it('should instantiate a correct schema', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'rename' },
    });
    expect(wrapper.vm.$data.schema).toEqual(renameStepSchema);
  });
});
