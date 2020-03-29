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
    mountWrapper = async function(isCurrentlyEditing: boolean = false) {
      let store;
      if (isCurrentlyEditing) {
        store = setupMockStore(buildStateWithOnePipeline([], { currentStepFormName: 'fillna' }));
      } else {
        store = setupMockStore();
      }
      const wrapper = shallowMount(ActionMenu, {
        store,
        localVue,
        propsData: { columnName: 'dreamfall' },
      });
      return { wrapper, store };
    };
  });

  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(ActionMenu);
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).toContain('popover-container');
  });

  it('should display the first panel', () => {
    const wrapper = shallowMount(ActionMenu);

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
    let mountWrapper: any;
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      mountWrapper = async function(isCurrentlyEditing: boolean = false) {
        let store;
        if (isCurrentlyEditing) {
          store = setupMockStore(buildStateWithOnePipeline([], { currentStepFormName: 'fillna' }));
        } else {
          store = setupMockStore();
        }
        const wrapper = shallowMount(ActionMenu, {
          store,
          localVue,
          propsData: { columnName: 'dreamfall' },
        });
        await wrapper
          .findAll('.action-menu__option')
          .at(3)
          .trigger('click');
        await wrapper.vm.$nextTick();
        return { wrapper, store };
      };
    });

    it('should display the second panel', async () => {
      const { wrapper } = await mountWrapper();
      let el: PanelElement;
      for (el of FIRST_PANEL) {
        expect(wrapper.html()).not.toContain(el.label);
      }
      for (el of SECOND_PANEL) {
        expect(wrapper.html()).toContain(el.label);
      }
    });

    it('should return to the first panel when click on back', async () => {
      const { wrapper } = await mountWrapper();

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
        const { wrapper } = await mountWrapper();
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

    describe('when click on the operation "get unique operation"', () => {
      it('should add a valid "unique" step in the pipeline', async () => {
        const { wrapper, store } = await mountWrapper();
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
        const { wrapper, store } = await mountWrapper(true);
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
