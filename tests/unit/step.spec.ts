import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import PipelineComponent from '@/components/Pipeline.vue';
import Step from '@/components/Step.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Step.vue', () => {
  it('should delete a step when clicking on the trash icon', () => {
    const pipeline: Pipeline = [
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: ['death'] },
    ];
    const store = setupStore({ pipeline });
    const wrapper = mount(PipelineComponent, { store, localVue });
    const step = wrapper.find(Step);
    step.find('.fa-trash-alt').trigger('click');
    expect(store.state.pipeline.length).toEqual(1);
  });

  it('should toggle the edit mode when clicking on the edit icon and emit editStep', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'rename', oldname: 'region', newname: 'kingdom' },
      { name: 'sort', columns: ['death'] },
    ];
    const store = setupStore({ pipeline, isEditingStep: false });
    const wrapper = mount(PipelineComponent, { store, localVue });
    const stepsArray = wrapper.findAll(Step);
    const renameStep = stepsArray.at(1);
    renameStep.find('.fa-cog').trigger('click');
    expect(renameStep.emitted()).toEqual({
      editStep: [[{ name: 'rename', oldname: 'region', newname: 'kingdom' }, 2]],
    });
  });
});
