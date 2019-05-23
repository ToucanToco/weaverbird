import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import PipelineComponent from '@/components/Pipeline.vue';
import Step from '@/components/Step.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: ['death'] },
    ];
    const store = setupStore({ pipeline });
    const wrapper = mount(PipelineComponent, { store, localVue });
    const step = wrapper.find(Step);
    step.find('i[class="fas fa-trash-alt"]').trigger('click');
    expect(store.state.pipeline.length).toEqual(1);
  });
});
