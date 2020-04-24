import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import ActionMenu from '@/components/ActionMenu.vue';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

type PanelElement = {
  label: string;
  stepName: string | null;
  index: number;
};

const FIRST_PANEL: PanelElement[] = [
  {
    label: 'Rename column',
    stepName: 'rename',
    index: 0,
  },
  {
    label: 'Duplicate column',
    stepName: 'duplicate',
    index: 1,
  },
  // "Delete" operation directly commit the step into the store, so it does not emit the stepname
  // it will be test apart of Rename and Duplicate
  {
    label: 'Delete column',
    stepName: null,
    index: 2,
  },
];

const SECOND_PANEL: PanelElement[] = [
  {
    label: 'Filter values',
    stepName: 'filter',
    index: 0,
  },
  {
    label: 'Fill null values',
    stepName: 'fillna',
    index: 1,
  },
  {
    label: 'Replace values',
    stepName: 'replace',
    index: 2,
  },
  {
    label: 'Sort values',
    stepName: 'sort',
    index: 3,
  },
  // "Get unique values" operation directly commit the step into the store, so it does not emit the stepname
  // it will be test apart
  {
    label: 'Get unique values',
    stepName: null,
    index: 4,
  },
];

describe('Action Menu', () => {
  let mountWrapper: any;
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    mountWrapper = async function(isCurrentlyEditing: boolean = false, isMounted: boolean = false) {
      const store = setupMockStore(
        buildStateWithOnePipeline([], {
          currentStepFormName: isCurrentlyEditing ? 'fillna' : undefined,
          dataset: {
            headers: [
              {
                name: 'dreamfall',
                uniques: {
                  values: [
                    { value: 'jjg', count: 2 },
                    { value: 'mika', count: 1 },
                  ],
                  loaded: false,
                },
              },
            ],
            data: [['jjg'], ['jjg'], ['mika']],
          },
        }),
      );
      const wrapper = (isMounted ? mount : shallowMount)(ActionMenu, {
        store,
        localVue,
        propsData: { visible: true, columnName: 'dreamfall' },
      });
      return { wrapper, store };
    };
  });

  it('should instantiate with popover', async () => {
    const { wrapper } = await mountWrapper(false, true);
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).toContain('popover-container');
  });

  it('should not display the apply filter button', async () => {
    const { wrapper } = await mountWrapper(false, true);
    expect(wrapper.find('.action-menu__apply-filter').exists()).toBeFalsy();
  });

  it('should display the first panel', async () => {
    const { wrapper } = await mountWrapper();
    let el: PanelElement;
    for (el of FIRST_PANEL) {
      expect(wrapper.html()).toContain(el.label);
    }
    for (el of SECOND_PANEL) {
      expect(wrapper.html()).not.toContain(el.label);
    }

    expect(wrapper.find('ListUniqueValues-stub').exists()).toBeTruthy();
    expect(wrapper.find('ListUniqueValues-stub').vm.$props.loaded).toEqual(false);
    expect(wrapper.find('ListUniqueValues-stub').vm.$props.filter).toEqual({
      column: 'dreamfall',
      value: [],
      operator: 'nin',
    });
    expect(wrapper.find('ListUniqueValues-stub').vm.$props.options).toEqual([
      { value: 'jjg', count: 2 },
      { value: 'mika', count: 1 },
    ]);
  });

  it('should close on click on any operation', async () => {
    let el: PanelElement;
    for (el of FIRST_PANEL) {
      const { wrapper } = await mountWrapper();
      await wrapper
        .findAll('.action-menu__option')
        .at(el.index)
        .trigger('click');
      expect(wrapper.emitted().closed).toBeTruthy();
    }
  });

  it('should emit "actionClicked" with the corresponding "stepName" when click on an operation', async () => {
    let el: PanelElement;
    for (el of FIRST_PANEL) {
      const { wrapper } = await mountWrapper();
      await wrapper
        .findAll('.action-menu__option')
        .at(el.index)
        .trigger('click');
      await wrapper.vm.$nextTick();
      if (el.stepName) {
        expect(wrapper.emitted().actionClicked[0]).toEqual([el.stepName]);
      }
    }
  });

  describe('when click on "Apply Filter"', () => {
    let mountWrapperWithEditedCondition: any;
    beforeEach(async () => {
      mountWrapperWithEditedCondition = async () => {
        const { wrapper, store } = await mountWrapper();
        wrapper
          .find('ListUniqueValues-stub')
          .vm.$emit('input', { column: 'dreamfall', value: ['mika'], operator: 'nin' });
        return { wrapper, store };
      };
    });
    it('should display "Apply Filter" when ListUniqueValue component emit a new condition', async () => {
      const { wrapper } = await mountWrapperWithEditedCondition();
      expect(wrapper.find('.action-menu__apply-filter').exists()).toBeTruthy();
    });
    it('should add a valid filter step', async () => {
      const { wrapper, store } = await mountWrapperWithEditedCondition();
      await wrapper.find('.action-menu__apply-filter').trigger('click');
      await wrapper.vm.$nextTick();
      expect(store.getters[VQBnamespace('pipeline')]).toEqual([
        { name: 'filter', condition: { column: 'dreamfall', value: ['mika'], operator: 'nin' } },
      ]);
    });
  });

  describe('when click on the operation "delete"', () => {
    it('should add a valid delete step in the pipeline', async () => {
      const { wrapper, store } = await mountWrapper();
      await wrapper
        .findAll('.action-menu__option')
        .at(2) //delete operation is at index 2
        .trigger('click');
      await wrapper.vm.$nextTick();
      expect(store.getters[VQBnamespace('pipeline')]).toEqual([
        { name: 'delete', columns: ['dreamfall'] },
      ]);
    });

    it('should close any open step form to show the addition of the delete step in the pipeline', async () => {
      const { wrapper, store } = await mountWrapper(true);
      await wrapper
        .findAll('.action-menu__option')
        .at(2) //delete operation is at index 2
        .trigger('click');
      await wrapper.vm.$nextTick();
      expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
    });
  });

  describe('when clicking on "Other operations"', () => {
    let mountWrapperAndClickOnOperation: any;
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      mountWrapperAndClickOnOperation = async function(isCurrentlyEditing: boolean = false) {
        const { wrapper, store } = await mountWrapper(isCurrentlyEditing);
        await wrapper
          .findAll('.action-menu__option')
          .at(3)
          .trigger('click');
        await wrapper.vm.$nextTick();
        return { wrapper, store };
      };
    });

    it('should display the second panel', async () => {
      const { wrapper } = await mountWrapperAndClickOnOperation();
      let el: PanelElement;
      for (el of FIRST_PANEL) {
        expect(wrapper.html()).not.toContain(el.label);
      }
      for (el of SECOND_PANEL) {
        expect(wrapper.html()).toContain(el.label);
      }
    });

    it('should return to the first panel when click on back', async () => {
      const { wrapper } = await mountWrapperAndClickOnOperation();

      expect(wrapper.find('.action-menu__option--back').exists()).toBeTruthy();
      await wrapper.find('.action-menu__option--back').trigger('click');

      let el: PanelElement;
      for (el of FIRST_PANEL) {
        expect(wrapper.html()).toContain(el.label);
      }
      for (el of SECOND_PANEL) {
        expect(wrapper.html()).not.toContain(el.label);
      }
    });

    it('should close on click on any operation', async () => {
      let el: PanelElement;
      for (el of SECOND_PANEL) {
        const { wrapper } = await mountWrapperAndClickOnOperation();
        await wrapper
          .findAll('.action-menu__option')
          .at(el.index)
          .trigger('click');
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted().closed).toBeTruthy();
      }
    });

    it('should emit "actionClicked" with the corresponding "stepName" when click on an operation', async () => {
      let el: PanelElement;
      for (el of SECOND_PANEL) {
        const { wrapper } = await mountWrapperAndClickOnOperation();
        await wrapper
          .findAll('.action-menu__option')
          .at(el.index)
          .trigger('click');
        await wrapper.vm.$nextTick();
        if (el.stepName) {
          expect(wrapper.emitted().actionClicked[0]).toEqual([el.stepName]);
        }
      }
    });

    describe('when click on the operation "get unique operation"', () => {
      it('should add a valid "unique" step in the pipeline', async () => {
        const { wrapper, store } = await mountWrapperAndClickOnOperation();
        await wrapper
          .findAll('.action-menu__option')
          .at(4) // "Get unique values" operation is at index 4
          .trigger('click');
        await wrapper.vm.$nextTick();
        expect(store.getters[VQBnamespace('pipeline')]).toEqual([
          { name: 'uniquegroups', on: ['dreamfall'] },
        ]);
      });

      it('should close any open step form to show the "get unique" step in the pipeline', async () => {
        const { wrapper, store } = await mountWrapperAndClickOnOperation(true);
        await wrapper
          .findAll('.action-menu__option')
          .at(4) // "Get unique values" operation is at index 4
          .trigger('click');
        await wrapper.vm.$nextTick();
        expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
      });
    });
  });
});
