import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import { expect, it, test, vi } from 'vitest';
import type { VueConstructor } from 'vue';

import type BaseStepForm from '@/components/stepforms/StepForm.vue';
import type { Pipeline } from '@/lib/steps';
import type { ValidationError } from '@/lib/translators/base';
import { setupVQBStore, useVQBStore } from '@/store';
import type { VQBState } from '@/store/state';
import { emptyState } from '@/store/state';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin, type Pinia, type Store } from 'pinia';

vi.mock('@/components/FAIcon.vue');

export type RootState = {
  vqb: VQBState;
};

export const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

export function buildState(customState: Partial<VQBState>) {
  return {
    ...emptyState(),
    ...customState,
  };
}

export function buildStateWithOnePipeline(pipeline: Pipeline, customState?: Partial<VQBState>) {
  return buildState({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: pipeline,
    },
    ...customState,
  });
}

export function setupMockStore(initialState: object = buildStateWithOnePipeline([])) {
  const store = useVQBStore();
  setupVQBStore(initialState);
  return store;
}

type ComponentType = typeof BaseStepForm;

type TestCaseConfiguration = {
  testlabel?: string;
  store?: Store<'vqb', RootState>;
  props?: { initialStepValue?: object; [prop: string]: any };
  data?: object;
};

type ValidationErrorConfiguration = TestCaseConfiguration & {
  errors: ValidationError[];
};

type MountOptions = {
  propsData?: object;
  data?: object;
};

export class BasicStepFormTestRunner {
  componentType: ComponentType;
  stepname: string;
  vue: VueConstructor;
  pinia: Pinia;

  constructor(componentType: ComponentType, stepname: string, vue?: VueConstructor) {
    this.componentType = componentType;
    this.stepname = stepname;
    this.vue = vue ?? localVue;
    this.pinia = createTestingPinia({
      createSpy: vi.fn(),
    });
  }

  _mount(shallow: boolean, initialState: object = {}, optional: MountOptions = {}) {
    if (initialState) {
      setupMockStore(initialState);
    }
    const mountfunc = shallow ? shallowMount : mount;
    const { propsData, data } = optional;
    const wrapper = mountfunc(this.componentType, {
      propsData,
      pinia: this.pinia,
      localVue: this.vue,
      sync: false,
    });
    if (data) {
      wrapper.setData(data);
    }
    return wrapper;
  }

  mount(initialState: object = {}, optional: MountOptions = {}) {
    return this._mount(false, initialState, optional);
  }

  shallowMount(initialState: object = {}, optional: MountOptions = {}) {
    return this._mount(true, initialState, optional);
  }

  testInstantiate() {
    it('should instantiate', () => {
      const wrapper = this.shallowMount();
      expect(wrapper.exists()).toBeTruthy();
      expect(wrapper.vm.$data.stepname).toEqual(this.stepname);
    });
  }

  testExpectedComponents(componentSpec: { [prop: string]: number }, initialState: object = {}) {
    const specStr = Object.entries(componentSpec)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    it(`should generate ${specStr} components`, () => {
      const wrapper = this.shallowMount(initialState);
      for (const [componentName, count] of Object.entries(componentSpec)) {
        const compWrappers = wrapper.findAll(componentName);
        expect(compWrappers.length).toEqual(count);
      }
    });
  }

  async checkValidationError(_testlabel: any, propsData: any, data: any, expectedErrors: any) {
    const wrapper = mount(this.componentType, {
      propsData,
      localVue: this.vue,
      pinia: this.pinia,
      sync: false,
    });
    if (data) {
      wrapper.setData(data);
    }
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await this.vue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    await this.vue.nextTick();
    expect(errors).toEqual(expectedErrors);
  }

  testValidationErrors(configurations: ValidationErrorConfiguration[]) {
    const cases = configurations.map(({ testlabel, props, data, errors }) => [
      testlabel,
      props ?? {},
      data,
      errors,
    ]);
    test.each(cases)(
      'should generate validation error if %s (#%#)',
      this.checkValidationError.bind(this),
    );
  }

  testValidate(testConfiguration: TestCaseConfiguration, expectedEmit?: object) {
    const { testlabel, store, props, data } = testConfiguration;
    // assume by default that the expected output is the initial input
    expectedEmit = expectedEmit ?? props?.initialStepValue;
    it(`should validate and emit "formSaved" when ${testlabel} -- click version`, async () => {
      setupMockStore();
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        propsData: props ?? {},
        sync: false,
      });
      if (data) {
        wrapper.setData(data);
      }
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await this.vue.nextTick();
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.emitted()).toEqual({
        formSaved: [[expectedEmit]],
      });
    });

    it(`should validate and emit "formSaved" when ${testlabel} -- shortcut ctrl+enter version`, async () => {
      setupMockStore();
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        propsData: props ?? {},
        sync: false,
      });
      if (data) {
        wrapper.setData(data);
      }
      wrapper.vm.$el.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, code: 'Enter' }));
      await this.vue.nextTick();
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.emitted()).toEqual({
        formSaved: [[expectedEmit]],
      });
    });

    it(`should validate and emit "formSaved" when ${testlabel} -- shortcut command+enter version`, async () => {
      setupMockStore();
      const wrapper = mount(this.componentType, {
        pinia: this.pinia,
        localVue: this.vue,
        propsData: props ?? {},
        sync: false,
      });
      if (data) {
        wrapper.setData(data);
      }
      wrapper.vm.$el.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, code: 'Enter' }));
      await this.vue.nextTick();
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.emitted()).toEqual({
        formSaved: [[expectedEmit]],
      });
    });
  }

  testCancel(initialState: Partial<VQBState> = buildStateWithOnePipeline([])) {
    const store = setupMockStore(initialState);
    const initialPipeline = [...(store.pipeline ?? [])];
    const initialStepIndex = store.selectedStepIndex;

    it('should emit "back" event when back button is clicked', () => {
      const wrapper = mount(this.componentType, {
        pinia: this.pinia,
        localVue: this.vue,
        sync: false,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(wrapper.emitted()).toEqual({ back: [[]] });
      expect(store.selectedStepIndex).toEqual(initialStepIndex);
      expect(store.pipeline).toEqual(initialPipeline);
    });

    it('should overwrite cancelEdition function', () => {
      const cancelEditionCustomMock = vi.fn();
      const methods = { cancelEdition: cancelEditionCustomMock };
      const wrapper = mount(this.componentType, {
        pinia: this.pinia,
        localVue: this.vue,
        sync: false,
        methods,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(cancelEditionCustomMock).toHaveBeenCalledTimes(1);
    });
  }

  testResetSelectedIndex(initialState?: Partial<VQBState>) {
    const store = setupMockStore(
      initialState ??
        buildStateWithOnePipeline(
          [
            { name: 'domain', domain: 'foo' },
            { name: 'rename', toRename: [['foo', 'bar']] },
            { name: 'rename', toRename: [['baz', 'spam']] },
            { name: 'rename', toRename: [['tic', 'tac']] },
          ],
          {
            selectedStepIndex: 2,
          },
        ),
    );
    const initialStepIndex = store.selectedStepIndex;

    it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
      const wrapper = mount(this.componentType, {
        pinia: this.pinia,
        localVue: this.vue,
        sync: false,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(store.selectedStepIndex).toEqual(initialStepIndex);

      wrapper.setProps({ isStepCreation: false });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(store.selectedStepIndex).toEqual(initialStepIndex + 1);
    });
  }
}
