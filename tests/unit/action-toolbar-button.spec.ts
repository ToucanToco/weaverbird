import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';

import ActionToolbarButton from '@/components/ActionToolbarButton.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

type VueMountedType = ReturnType<typeof mount>;
type emitParameters = string | [string, object] | undefined;

function assertMenuEmitsExpected(wrapper: VueMountedType, expectedEmits: emitParameters[]) {
  const actionsWrappers = wrapper.findAll('.action-menu__option');
  expect(actionsWrappers.length).toEqual(expectedEmits.length);
  for (const [idx, parameters] of Object.entries(expectedEmits)) {
    actionsWrappers.at(Number(idx)).trigger('click');
    let expected = parameters;
    if (typeof parameters === 'string') {
      if (parameters[0] === '!') {
        expected = undefined;
      } else {
        expected = [parameters, {}];
      }
    }
    expect(wrapper.emitted().actionClicked[Number(idx)]).toEqual(expected);
  }
}

describe('ActionToolbarButton', () => {
  it('should instantiate an Add button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'add' } });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['text', 'formula', 'custom']);
  });

  it('should instantiate a Filter button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'filter' } });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['delete', 'select', 'filter', 'top', 'argmax', 'argmin']);
  });

  it('should instantiate a Compute button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'compute' } });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['formula', 'percentage']);
  });

  it('should instantiate a Text button with the right list of actions', () => {
    // instantiate a store with at least one column selected so that steps
    // such as 'lowercase' can be triggered without creating a form.
    const store = setupMockStore({ selectedColumns: ['foo'] });
    const wrapper = mount(ActionToolbarButton, {
      propsData: { category: 'text' },
      localVue,
      store,
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, [
      'text',
      'concatenate',
      'split',
      'substring',
      '!lowercase',
      '!uppercase',
    ]);
  });

  it('should instantiate a Date button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'date' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(12);
    const wrappers = actionsWrappers.wrappers.map(w => w.text());
    expect(wrappers).toEqual([
      'Convert text to date',
      'Convert date to text',
      'Extract year from date',
      'Extract month from date',
      'Extract day from date',
      'Extract hour from date',
      'Extract minutes from date',
      'Extract seconds from date',
      'Extract milliseconds from date',
      'Extract day of year from date',
      'Extract day of week from date',
      'Extract week from date',
    ]);
  });

  it('should instantiate an Aggregate button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'aggregate' } });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = wrapper.findAll('.action-menu__option');
    expect(actionsWrappers.length).toEqual(0);
  });

  it('should instantiate a Reshape button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'reshape' } });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['pivot', 'unpivot']);
  });

  it('should instantiate a Combine button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, { propsData: { category: 'combine' } });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['append', 'join']);
  });

  describe('When clicking on the "To lowercase" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'lowercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('When clicking on the "To uppercase" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(5).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(5).trigger('click');
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'uppercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(5).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('When clicking on the "Convert from text to date" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'date' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(0).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a todate step in pipeline', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'date' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(0).trigger('click');
      expect(store.state.vqb.pipeline).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'todate', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore({
        pipeline: [{ name: 'domain', domain: 'myDomain' }],
        selectedColumns: ['foo'],
      });
      const wrapper = mount(ActionToolbarButton, {
        propsData: { category: 'date' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(0).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  for (const [idx, operation] of Object.entries([
    'year',
    'month',
    'day',
    'hour',
    'minutes',
    'seconds',
    'milliseconds',
    'dayOfYear',
    'dayOfWeek',
    'week',
  ])) {
    describe(`When clicking on the "Extract ${operation} from" operation`, () => {
      it('should insert a todate step in pipeline', async () => {
        const store = setupMockStore({
          pipeline: [{ name: 'domain', domain: 'myDomain' }],
          selectedColumns: ['foo'],
        });
        const wrapper = mount(ActionToolbarButton, {
          propsData: { category: 'date' },
          store,
          localVue,
        });
        const actionsWrappers = wrapper.findAll('.action-menu__option');
        await actionsWrappers.at(Number(idx) + 2).trigger('click');
        expect(store.state.vqb.pipeline).toEqual([
          { name: 'domain', domain: 'myDomain' },
          { name: 'dateextract', column: 'foo', operation },
        ]);
        expect(store.state.vqb.selectedStepIndex).toEqual(1);
      });

      it('should emit a close event', async () => {
        const store = setupMockStore({
          pipeline: [{ name: 'domain', domain: 'myDomain' }],
          selectedColumns: ['foo'],
        });
        const wrapper = mount(ActionToolbarButton, {
          propsData: { category: 'date' },
          store,
          localVue,
        });
        const actionsWrappers = wrapper.findAll('.action-menu__option');
        await actionsWrappers.at(Number(idx) + 2).trigger('click');
        expect(wrapper.emitted().closed).toBeTruthy();
      });
    });
  }
});
