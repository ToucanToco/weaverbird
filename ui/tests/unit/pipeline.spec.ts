import type { Wrapper } from '@vue/test-utils';
import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import type { SpyInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import * as clipboardUtils from '@/lib/clipboard';
import type { Pipeline } from '@/lib/steps';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

vi.mock('@/components/FAIcon.vue');

import { PiniaVuePlugin, type Store } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', searchColumn: 'characters', toReplace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    const steps = wrapper.findAll('step-stub');
    expect(steps.length).toEqual(3);
    const [step1, step2, step3] = steps.wrappers.map((stub) => stub.props());
    expect(step1).toEqual({
      step: pipeline[0],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: true,
      isLast: false,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 0,
    });
    expect(step2).toEqual({
      step: pipeline[1],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: false,
      isLast: false,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 1,
    });
    expect(step3).toEqual({
      step: pipeline[2],
      isActive: false,
      isLastActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      toDelete: false,
      isEditable: true,
      indexInPipeline: 2,
    });
  });

  it('should render a container with tips', () => {
    const pipeline: Pipeline = [{ name: 'domain', domain: 'GoT' }];
    setupMockStore({ pipeline });
    const wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    expect(wrapper.find('.query-pipeline__tips').text()).toEqual(
      'Interact with the widgets and table on the right to add steps',
    );
    const icons = wrapper.findAll('FAIcon-stub');
    expect(icons.at(0).props().icon).toBe('wand-magic-sparkles');
  });

  describe('toggle delete step', () => {
    let wrapper: Wrapper<PipelineComponent>, stepToDelete: Wrapper<any>;
    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = shallowMount(PipelineComponent, { pinia, localVue });
      const steps = wrapper.findAll('step-stub');
      stepToDelete = steps.at(1);
      stepToDelete.vm.$emit('toggleDelete');
      await wrapper.vm.$nextTick();
    });

    it('should add step index to steps to delete', () => {
      expect((wrapper.vm as any).selectedSteps).toContain(1);
    });
    it('should apply delete class to step', () => {
      expect(stepToDelete.props().toDelete).toBe(true);
    });

    describe('when already selected', () => {
      beforeEach(async () => {
        stepToDelete.vm.$emit('toggleDelete');
        await wrapper.vm.$nextTick();
      });
      it('should remove step index from step to delete', () => {
        expect((wrapper.vm as any).selectedSteps).not.toContain(1);
      });
      it('should remove delete class from step', () => {
        expect(stepToDelete.props().toDelete).toBe(false);
      });
    });

    describe('when there is steps selected', () => {
      beforeEach(async () => {
        wrapper.setData({ selectedSteps: [1, 2] });
        await wrapper.vm.$nextTick();
      });
      it('should show the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps-container').exists()).toBe(true);
      });
      it('should display the number of selected steps into the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps').text()).toContain(
          'Delete [2] selected',
        );
      });
      it('should make steps uneditable', () => {
        const steps = wrapper.findAll('step-stub');
        steps.wrappers.map((stub) => expect(stub.props().isEditable).toBe(false));
      });
    });

    describe('when there is no steps to delete', () => {
      beforeEach(async () => {
        wrapper.setData({ selectedSteps: [] });
        await wrapper.vm.$nextTick();
      });
      it('should hide the delete steps button', () => {
        expect(wrapper.find('.qquery-pipeline__delete-steps-container').exists()).toBe(false);
      });
    });
  });

  it('does not render a delete confirmation modal by default', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'rename', toRename: [['foo', 'bar']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBe(false);
  });

  describe('clicking on the delete button', () => {
    let wrapper: Wrapper<PipelineComponent>, modal: Wrapper<any>, store: Store<'vqb', any>;
    const selectedSteps = [1, 2];

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      store = setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = mount(PipelineComponent, { pinia, localVue });
      wrapper.setData({ selectedSteps });
      wrapper.find('.query-pipeline__delete-steps').trigger('click');
      await wrapper.vm.$nextTick();
      modal = wrapper.find(DeleteConfirmationModal);
    });

    it('should render a delete confirmation modal', async () => {
      expect(modal.exists()).toBe(true);
    });

    describe('when cancel confirmation', () => {
      beforeEach(async () => {
        modal.find('.vqb-modal__action--secondary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should not delete the selected steps', () => {
        expect(store.deleteSteps).not.toHaveBeenCalled();
      });
      it('should keep the selected steps unchanged', () => {
        expect((wrapper.vm as any).selectedSteps).toStrictEqual(selectedSteps);
      });
    });

    describe('when validate', () => {
      beforeEach(async () => {
        modal.find('.vqb-modal__action--primary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should delete the selected steps', () => {
        expect(store.deleteSteps).toHaveBeenCalledWith({
          indexes: selectedSteps,
        });
      });
      it('should clean the selected steps', () => {
        expect((wrapper.vm as any).selectedSteps).toStrictEqual([]);
      });
    });
  });

  describe('clicking on backspace', () => {
    let wrapper: Wrapper<PipelineComponent>, modal: Wrapper<any>;
    const selectedSteps = [1, 2];

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = mount(PipelineComponent, { pinia, localVue });
      wrapper.setData({ selectedSteps });
      (wrapper.vm as any).keyDownEventHandler({ key: 'Backspace' });
      await wrapper.vm.$nextTick();
      modal = wrapper.find(DeleteConfirmationModal);
    });

    it('should render a delete confirmation modal', async () => {
      expect(modal.exists()).toBe(true);
    });
  });

  describe('reorder steps', () => {
    let wrapper: Wrapper<PipelineComponent>, store: Store<'vqb', any>;

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        { name: 'sort', columns: [{ column: 'death', order: 'desc' }] },
      ];
      store = setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    });

    it('should have a draggable steps list as pipeline', () => {
      expect(wrapper.find('Draggable-stub').exists()).toBe(true);
    });
    describe('when steps position are arranged', () => {
      const reorderedPipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'desc' }] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];

      beforeEach(async () => {
        wrapper.find('draggable-stub').vm.$emit('input', reorderedPipeline); // fake drag/drop step action
        await wrapper.vm.$nextTick();
      });

      it('should rerender pipeline', () => {
        expect(store.setPipeline).toHaveBeenCalledWith({ pipeline: reorderedPipeline });
      });

      it('should update active step index', () => {
        expect(store.selectStep).toHaveBeenCalledWith({ index: 2 });
      });
    });
  });

  describe('copy steps', () => {
    let wrapper: Wrapper<PipelineComponent>, copyToClipboardStub: SpyInstance;
    const ctrlC = () => {
      (wrapper.vm as any).keyDownEventHandler({ key: 'c', ctrlKey: true }); // fake ctrl + c;
    };
    const cmdC = () => {
      (wrapper.vm as any).keyDownEventHandler({ key: 'c', metaKey: true }); // fake cmd + c;
    };

    beforeEach(() => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      setupMockStore(buildStateWithOnePipeline(pipeline));
      copyToClipboardStub = vi
        .spyOn(clipboardUtils, 'copyToClipboard')
        .mockImplementation(() => Promise.resolve());
      wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('with ctrl + c', () => {
      it('should not copy selected steps content if empty', () => {
        ctrlC();
        expect(copyToClipboardStub).not.toHaveBeenCalled();
      });

      it('should copy selected steps content to clipboard', () => {
        const selectedSteps = [1, 2];
        wrapper.setData({ selectedSteps });
        ctrlC();
        const stringifiedStepsContent = JSON.stringify([
          { name: 'rename', toRename: [['foo', 'bar']] },
          { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        ]);
        expect(copyToClipboardStub).toHaveBeenCalledWith(stringifiedStepsContent);
      });
    });

    describe('with cmd + c', () => {
      it('should not copy selected steps content if empty', () => {
        cmdC();
        expect(copyToClipboardStub).not.toHaveBeenCalled();
      });

      it('should copy selected steps content to clipboard', () => {
        const selectedSteps = [1, 2];
        wrapper.setData({ selectedSteps });
        cmdC();
        const stringifiedStepsContent = JSON.stringify([
          { name: 'rename', toRename: [['foo', 'bar']] },
          { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        ]);
        expect(copyToClipboardStub).toHaveBeenCalledWith(stringifiedStepsContent);
      });
    });
  });
  describe('paste steps', () => {
    let wrapper: Wrapper<PipelineComponent>,
      store: Store<'vqb', any>,
      pasteFromClipboardStub: SpyInstance;
    const ctrlV = () => {
      (wrapper.vm as any).keyDownEventHandler({ key: 'v', ctrlKey: true }); // fake ctrl + v;
    };
    const cmdV = () => {
      (wrapper.vm as any).keyDownEventHandler({ key: 'v', metaKey: true }); // fake cmd + v;
    };

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
        { name: 'sort', columns: [{ column: 'death', order: 'desc' }] },
      ];
      store = setupMockStore(buildStateWithOnePipeline(pipeline));
      pasteFromClipboardStub = vi.spyOn(clipboardUtils, 'pasteFromClipboard');
      wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    });

    describe('with valid steps', () => {
      const stepsFromClipboard = [
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      beforeEach(async () => {
        pasteFromClipboardStub.mockResolvedValue(JSON.stringify(stepsFromClipboard));
        ctrlV();
      });
      it('should retrieved selected steps from clipboard', () => {
        expect(pasteFromClipboardStub).toHaveBeenCalled();
      });
      it('should add steps to pipeline', () => {
        expect(store.addSteps).toHaveBeenCalledWith({
          steps: stepsFromClipboard,
        });
      });
    });

    describe('with cmd + v', () => {
      const stepsFromClipboard = [
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      beforeEach(async () => {
        pasteFromClipboardStub.mockResolvedValue(JSON.stringify(stepsFromClipboard));
        cmdV();
      });
      it('should retrieved selected steps from clipboard', () => {
        expect(pasteFromClipboardStub).toHaveBeenCalled();
      });
      it('should add steps to pipeline', () => {
        expect(store.addSteps).toHaveBeenCalledWith({
          steps: stepsFromClipboard,
        });
      });
    });

    describe('with invalid steps', () => {
      const stepsFromClipboard = [
        'TOTO',
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      beforeEach(async () => {
        pasteFromClipboardStub.mockResolvedValue(JSON.stringify(stepsFromClipboard));
        ctrlV();
      });
      it('should not add steps to pipeline', () => {
        expect(store.addSteps).not.toHaveBeenCalledWith({
          steps: stepsFromClipboard,
        });
      });
    });

    describe('when passed steps are not an array', () => {
      const stepsFromClipboard = 'TOTO';
      beforeEach(async () => {
        pasteFromClipboardStub.mockResolvedValue(JSON.stringify(stepsFromClipboard));
        ctrlV();
      });
      it('should not add steps to pipeline', () => {
        expect(store.addSteps).not.toHaveBeenCalledWith({
          steps: stepsFromClipboard,
        });
      });
    });
  });
  describe('without supported steps', () => {
    let wrapper: Wrapper<PipelineComponent>;
    beforeEach(() => {
      setupMockStore(
        buildStateWithOnePipeline([], {
          translator: 'empty', // there is no supported actions in empty translator
          dataset: {
            headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
            data: [['value1', 'value2', 'value3']],
            paginationContext: {
              shouldPaginate: false,
              totalCount: 10,
              pageSize: 10,
              pageNumber: 1,
              isLastPage: true,
            },
          },
        }),
      );
      wrapper = shallowMount(PipelineComponent, { pinia, localVue });
    });

    it('should hide the pipeline tips', () => {
      expect(wrapper.find('.query-pipeline__tips-container').exists()).toBeFalsy();
    });
  });
});
