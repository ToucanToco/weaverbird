import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';

import ActionToolbarButton from '@/components/ActionToolbarButton.vue';
import Popover from '@/components/Popover.vue';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

type VueMountedType = ReturnType<typeof mount>;
type emitParameters = string | [string, object] | undefined;

function last(array: any[]) {
  return array[array.length - 1];
}

/**
 * assert a action toolbar button generates the expected list of items and that
 * each click on these items triggers the expected stepname.
 *
 * For instsance, if you want to check that your menu has two steps `pivot` and
 * `unpivot` and check that clicks on these both items emit the `actionClicked`
 * event with the corresponding step name, you will do:
 * ```
 * assertMenuEmitsExpected(wrapper, ['pivot', 'unpivot'])
 * ```
 * If your step name should be present but should not emit the `actionClicked`
 * event, you can prefix the stepname with a `!`, e.g. `['pivot', 'unpivot',
 * '!lowercase']`
 *
 * If the `actionClicked` event is supposed to be emitted with extra parameters,
 * you can use an array of parameters instead of a string to specify the
 * stepname, e.g. `['!todate', ['dateextract', {operation: 'minutes'}]]`.
 *
 * @param wrapper the ActionToolbarButton wrapper
 * @param expectedEmits a list of expected stepnames that should be emitted when
 * each item is clicked on.
 *
 * @return the list of menu item wrappers
 */
function assertMenuEmitsExpected(wrapper: VueMountedType, expectedEmits: emitParameters[]) {
  const actionsWrappers = wrapper.findAll('.action-menu__option');
  expect(actionsWrappers.length).toEqual(expectedEmits.length);
  let shouldEmit;
  for (const [idx, parameters] of Object.entries(expectedEmits)) {
    let expected = parameters;
    actionsWrappers.at(Number(idx)).trigger('click');
    shouldEmit = true;
    if (typeof parameters === 'string') {
      if (parameters[0] === '!') {
        expected = undefined;
        shouldEmit = false;
      } else {
        expected = [parameters, {}];
      }
    }
    if (shouldEmit) {
      expect(last(wrapper.emitted().actionClicked)).toEqual(expected);
    }
  }
  return actionsWrappers;
}

describe('ActionToolbarButton not active', () => {
  it('should instantiate with icon an label', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { category: 'add', label: 'toto', icon: 'plop' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.find('.action-toolbar__btn-txt').text()).toEqual('toto');
    expect(wrapper.find('.fa-plop').exists()).toBeTruthy();
  });

  it('should instantiate without popover', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { category: 'add' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.find(Popover).vm.$props.visible).toBeFalsy();
  });
});

describe('ActionToolbarButton active', () => {
  it('should instantiate an Add button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'add' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['text', 'formula', 'ifthenelse', 'custom']);
  });

  it('should instantiate a Filter button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'filter' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['delete', 'select', 'filter', 'top', 'argmax', 'argmin']);
  });

  it('should instantiate a Compute button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'compute' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, [
      'formula',
      'evolution',
      'cumsum',
      'percentage',
      'rank',
      'movingaverage',
      'statistics',
    ]);
  });

  it('should instantiate a Text button with the right list of actions', () => {
    // instantiate a store with at least one column selected so that steps
    // such as 'lowercase' can be triggered without creating a form.
    const store = setupMockStore(buildStateWithOnePipeline([], { selectedColumns: ['foo'] }));
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'text' },
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
      'strcmp',
    ]);
  });

  it('should not display unsupported steps', () => {
    // the pandas translator doesn't support custom steps
    const store = setupMockStore(
      buildStateWithOnePipeline([], { selectedColumns: ['foo'], translator: 'pandas' }),
    );
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'add' },
      localVue,
      store,
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, [
      'text',
      'formula',
      'ifthenelse',
      // not 'custom'
    ]);
  });

  it('should instantiate a Date button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'date' },
      store: setupMockStore(),
      localVue,
    });
    expect(wrapper.exists()).toBeTruthy();
    const actionsWrappers = assertMenuEmitsExpected(wrapper, [
      'todate',
      'fromdate',
      '!dateextract', // year
      '!dateextract', // month
      '!dateextract', // day
      '!dateextract', // week
      ['dateextract', { operation: 'hour' }], // other
      'addmissingdates',
      'duration',
    ]);
    const wrappers = actionsWrappers.wrappers.map(w => w.text());
    expect(wrappers).toEqual([
      'Convert text to date',
      'Convert date to text',
      'Extract year',
      'Extract month',
      'Extract day',
      'Extract week',
      'Extract other',
      'Add missing dates',
      'Compute duration',
    ]);
  });

  it('should instantiate an Aggregate button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'aggregate' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['aggregate', 'totals', 'rollup', 'uniquegroups']);
  });

  it('should instantiate a Reshape button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'reshape' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['pivot', 'unpivot', 'waterfall']);
  });

  it('should instantiate a Combine button with the right list of actions', () => {
    const wrapper = mount(ActionToolbarButton, {
      propsData: { isActive: true, category: 'combine' },
      localVue,
      store: setupMockStore(),
    });
    expect(wrapper.exists()).toBeTruthy();
    assertMenuEmitsExpected(wrapper, ['append', 'join']);
  });

  describe('When clicking on the "To lowercase" operation', () => {
    it('should close any open step form', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(4).trigger('click');
      expect(store.getters[VQBnamespace('pipeline')]).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'lowercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
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
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(5).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should insert a lowercase step in pipeline', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(5).trigger('click');
      expect(store.getters[VQBnamespace('pipeline')]).toEqual([
        { name: 'domain', domain: 'myDomain' },
        { name: 'uppercase', column: 'foo' },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'text' },
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
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'date' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(0).trigger('click');
      expect(store.state.vqb.currentStepFormName).toEqual(undefined);
    });

    it('should emit a close event', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
          selectedColumns: ['foo'],
        }),
      );
      const wrapper = mount(ActionToolbarButton, {
        propsData: { isActive: true, category: 'date' },
        store,
        localVue,
      });
      const actionsWrappers = wrapper.findAll('.action-menu__option');
      await actionsWrappers.at(0).trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  for (const [idx, operation] of Object.entries(['year', 'month', 'day', 'week'])) {
    describe(`When clicking on the "Extract ${operation} from" operation`, () => {
      it('should insert a todate step in pipeline', async () => {
        const store = setupMockStore(
          buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
            selectedColumns: ['foo'],
          }),
        );
        const wrapper = mount(ActionToolbarButton, {
          propsData: { isActive: true, category: 'date' },
          store,
          localVue,
        });
        const actionsWrappers = wrapper.findAll('.action-menu__option');
        await actionsWrappers.at(Number(idx) + 2).trigger('click');
        expect(store.getters[VQBnamespace('pipeline')]).toEqual([
          { name: 'domain', domain: 'myDomain' },
          { name: 'dateextract', column: 'foo', operation },
        ]);
        expect(store.state.vqb.selectedStepIndex).toEqual(1);
      });

      it('should emit a close event', async () => {
        const store = setupMockStore(
          buildStateWithOnePipeline([{ name: 'domain', domain: 'myDomain' }], {
            selectedColumns: ['foo'],
          }),
        );
        const wrapper = mount(ActionToolbarButton, {
          propsData: { isActive: true, category: 'date' },
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
