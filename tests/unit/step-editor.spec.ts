import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import StepEditor from '@/components/StepEditor.vue';
import { renameStepSchema } from '@/assets/schemas';

describe('Step editor', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(StepEditor);
    expect(wrapper.exists()).to.be.true;
  });

  it('should have a rename title', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'rename' },
    });
    expect(wrapper.text()).to.equal('Rename step configuration');
  });

  it('should have a filter title', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'filter' },
    });
    expect(wrapper.text()).to.equal('Filter step configuration');
  });

  it('should have a default title', () => {
    const wrapper = shallowMount(StepEditor);
    expect(wrapper.text()).to.equal('step configuration');
  });

  it('should instantiate a correct schema', () => {
    const wrapper = shallowMount(StepEditor, {
      propsData: { name: 'rename' },
    });
    expect(wrapper.vm.$data.schema).to.eql(renameStepSchema);
  });
});
