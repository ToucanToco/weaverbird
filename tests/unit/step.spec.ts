import { createLocalVue, mount, shallowMount, Wrapper } from '@vue/test-utils';
import Vuex from 'vuex';

import PipelineComponent from '@/components/Pipeline.vue';
import Step from '@/components/Step.vue';
import { Pipeline } from '@/lib/steps';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Step.vue', () => {
  const createStepWrapper = ({ propsData = {} }) => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'rename', toRename: [['region', 'kingdom']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
    return shallowMount(Step, {
      propsData,
      store,
      localVue,
    });
  };

  it('emit selectedStep when clicking on the step itself', async () => {
    const wrapper = createStepWrapper({
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', toRename: [['foo', 'bar']] },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.query-pipeline-step').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({ selectedStep: [[]] });
  });

  it('emit toggleDelete when clicking on a step "time travel" dot', async () => {
    const wrapper = createStepWrapper({
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', toRename: [['foo', 'bar']] },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({ toggleDelete: [[]] });
  });

  it('should not enable to delete domain step', async () => {
    const wrapper = createStepWrapper({
      propsData: {
        key: 0,
        isActive: true,
        isLastActive: true,
        isDisabled: false,
        isFirst: true,
        isLast: true,
        step: { name: 'domain', domain: 'GoT' },
        indexInPipeline: 0,
      },
    });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted().toggleDelete).toBeUndefined();
  });
  it('should render a stepLabel with the variable names', () => {
    const wrapper = createStepWrapper({
      propsData: {
        key: 0,
        isActive: true,
        isLastActive: true,
        isDisabled: false,
        isFirst: true,
        isLast: true,
        step: { name: 'domain', domain: '{{ user.username }}' },
        indexInPipeline: 0,
        variableDelimiters: { start: '{{ ', end: ' }}' },
      },
    });
    expect(wrapper.find('.query-pipeline-step__name').text()).toBe('Source: "user.username"');
  });

  it('should toggle the edit mode when clicking on the edit icon and emit editStep', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'rename', toRename: [['region', 'kingdom']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = mount(PipelineComponent, { store, localVue });
    const stepsArray = wrapper.findAll(Step);
    const renameStep = stepsArray.at(2);
    renameStep.find('.fa-cog').trigger('click');
    expect(renameStep.emitted().editStep).toBeDefined();
    expect(renameStep.emitted().editStep).toEqual([
      [{ name: 'rename', toRename: [['region', 'kingdom']] }, 2],
    ]);
  });

  it('should toggle the edit mode when clicking on button with the edit icon and emit editStep', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'rename', toRename: [['region', 'kingdom']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(
      buildStateWithOnePipeline(pipeline, { currentStepFormName: 'rename' }),
    );
    const wrapper = mount(PipelineComponent, { store, localVue });
    const stepsArray = wrapper.findAll(Step);
    const renameStep = stepsArray.at(2);
    renameStep
      .findAll('.query-pipeline-step__action')
      .at(0)
      .trigger('click');
    expect(renameStep.emitted().editStep).toBeDefined();
    expect(renameStep.emitted().editStep).toEqual([
      [{ name: 'rename', toRename: [['region', 'kingdom']] }, 2],
    ]);
  });

  describe('with errors', () => {
    it('should highlight the error step', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      ];
      const store = setupMockStore(
        buildStateWithOnePipeline(pipeline, {
          currentStepFormName: 'replace',
          backendMessages: [
            { index: 1, message: 'I am an error for the replace step', type: 'error' },
          ],
        }),
      );
      const wrapper = mount(PipelineComponent, { store, localVue });
      const stepsArray = wrapper.findAll(Step);
      const replaceStep = stepsArray.at(1);
      expect(replaceStep.classes()).toContain('query-pipeline-step__container--errors');
    });

    it('should display the error message', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      ];
      const store = setupMockStore(
        buildStateWithOnePipeline(pipeline, {
          currentStepFormName: 'replace',
          backendMessages: [
            { index: 1, message: 'I am an error for the replace step', type: 'error' },
          ],
        }),
      );
      const wrapper = mount(PipelineComponent, { store, localVue });
      const stepsArray = wrapper.findAll(Step);
      const replaceStep = stepsArray.at(1);
      expect(replaceStep.find('.query-pipeline-step__footer').exists()).toBe(true);
      expect(replaceStep.find('.query-pipeline-step__footer').text()).toContain(
        'I am an error for the replace step',
      );
    });

    it('should override with disabled style when disabled', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      ];
      const store = setupMockStore(
        buildStateWithOnePipeline(pipeline, {
          currentStepFormName: 'domain',
          backendMessages: [
            { index: 1, message: 'I am an error for the replace step', type: 'error' },
          ],
        }),
      );
      const wrapper = mount(PipelineComponent, { store, localVue });
      const stepsArray = wrapper.findAll(Step);
      stepsArray
        .at(0)
        .find('.query-pipeline-step')
        .trigger('click');
      await localVue.nextTick();
      const replaceStep = stepsArray.at(1);
      expect(replaceStep.find('.query-pipeline-step__footer').exists()).toBe(false);
      expect(replaceStep.classes()).not.toContain('query-pipeline-step__container--errors');
    });
  });

  describe('when step is not editable (delete mode)', () => {
    let wrapper: Wrapper<Step>;
    beforeEach(() => {
      wrapper = createStepWrapper({
        propsData: {
          key: 0,
          isActive: true,
          isDisabled: false,
          isFirst: false,
          isLast: true,
          isEditable: false,
          step: { name: 'rename', toRename: [['foo', 'bar']] },
          indexInPipeline: 2,
        },
      });
    });
    it('should disable actions buttons', () => {
      expect(wrapper.find('.query-pipeline-step__actions').classes()).toContain(
        'query-pipeline-step__actions--disabled',
      );
    });
  });
});
