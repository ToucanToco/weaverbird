import { createTestingPinia } from '@pinia/testing';
import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import { type Pinia, type Store, PiniaVuePlugin } from 'pinia';
import { describe, expect, it, test, vi } from 'vitest';
import type { VueConstructor } from 'vue';

import type BaseStepForm from '@/components/stepforms/StepForm.vue';
import StoreStepFormComponent from '@/components/stepforms/StoreStepFormComponent.vue';
import type { Pipeline } from '@/lib/steps';
import type { ValidationError } from '@/lib/translators/base';
import { setupVQBStore, useVQBStore } from '@/store';
import type { VQBState } from '@/store/state';
import { emptyState } from '@/store/state';

vi.mock('@/components/FAIcon.vue');

export const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

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
  store?: Store<'vqb', any>;
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
  store: Store<'vqb', any>;
  pinia: Pinia;

  requiredStepProps = {
    columnTypes: {},
    interpolateFunc: (a: any) => a,
    getColumnNamesFromPipeline: () => Promise.resolve([]),
  };

  constructor(componentType: ComponentType, stepname: string, vue?: VueConstructor) {
    this.componentType = componentType;
    this.stepname = stepname;
    this.vue = vue ?? localVue;
    this.store = useVQBStore();
    this.pinia = pinia;
  }

  _mount(shallow: boolean, optional: MountOptions = {}) {
    const mountfunc = shallow ? shallowMount : mount;
    const { propsData, data } = optional;
    const wrapper = mountfunc(this.componentType, {
      propsData: {
        ...this.requiredStepProps,
        ...propsData,
      },
      localVue: this.vue,
      pinia: this.pinia,
      sync: false,
    });
    if (data) {
      wrapper.setData(data);
    }
    return wrapper;
  }

  mount(optional: MountOptions = {}) {
    return this._mount(false, optional);
  }

  shallowMount(optional: MountOptions = {}) {
    return this._mount(true, optional);
  }

  getStore() {
    return this.store;
  }

  testInstantiate() {
    it('should instantiate', () => {
      const wrapper = this.shallowMount();
      expect(wrapper.exists()).toBeTruthy();
      expect(wrapper.vm.$data.stepname).toEqual(this.stepname);
    });
  }

  testExpectedComponents(componentSpec: { [prop: string]: number }, propsData: object = {}) {
    const specStr = Object.entries(componentSpec)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ');
    it(`should generate ${specStr} components`, () => {
      const wrapper = this.shallowMount({ propsData });
      for (const [componentName, count] of Object.entries(componentSpec)) {
        const compWrappers = wrapper.findAll(componentName);
        expect(compWrappers.length).toEqual(count);
      }
    });
  }

  async checkValidationError(_testlabel: any, propsData: any, data: any, expectedErrors: any) {
    const wrapper = mount(this.componentType, {
      propsData: {
        ...this.requiredStepProps,
        ...propsData,
      },
      localVue: this.vue,
      pinia: this.pinia,
    });
    if (data) {
      wrapper.setData(data);
    }
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await this.vue.nextTick();
    // For Options API, errors might be in data or computed
    const wrapperErrors = wrapper.vm.$data.errors || wrapper.vm.errors || [];
    const errors = wrapperErrors
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
    const { testlabel, props, data } = testConfiguration;
    // assume by default that the expected output is the initial input
    expectedEmit = expectedEmit ?? props?.initialStepValue;

    describe(`should validate and emit "formSaved" when ${testlabel}`, () => {
      it(`click version`, async () => {
        const wrapper = mount(this.componentType, {
          localVue: this.vue,
          pinia: this.pinia,
          propsData: {
            ...this.requiredStepProps,
            ...(props ?? {}),
          },
          sync: false,
        });
        if (data) {
          wrapper.setData(data);
        }
        wrapper.find('.widget-form-action__button--validate').trigger('click');
        await this.vue.nextTick();
        // For Options API, errors might be in data or computed
        const errors = wrapper.vm.$data.errors || wrapper.vm.errors;
        expect(errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });

      it(`shortcut ctrl+enter version`, async () => {
        const wrapper = mount(this.componentType, {
          localVue: this.vue,
          pinia: this.pinia,
          propsData: { ...this.requiredStepProps, ...(props ?? {}) },
          sync: false,
        });
        if (data) {
          wrapper.setData(data);
        }
        wrapper.vm.$el.dispatchEvent(
          new KeyboardEvent('keydown', { ctrlKey: true, code: 'Enter' }),
        );
        await this.vue.nextTick();
        // For Options API, errors might be in data or computed
        const errors = wrapper.vm.$data.errors || wrapper.vm.errors;
        expect(errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });

      it(`shortcut command+enter version`, async () => {
        const wrapper = mount(this.componentType, {
          localVue: this.vue,
          pinia: this.pinia,
          propsData: { ...this.requiredStepProps, ...(props ?? {}) },
          sync: false,
        });
        if (data) {
          wrapper.setData(data);
        }
        wrapper.vm.$el.dispatchEvent(
          new KeyboardEvent('keydown', { metaKey: true, code: 'Enter' }),
        );
        await this.vue.nextTick();
        // For Options API, errors might be in data or computed
        const errors = wrapper.vm.$data.errors || wrapper.vm.errors;
        expect(errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });
    });
  }

  testCancel() {
    it('should emit "back" event when back button is clicked', () => {
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        pinia: this.pinia,
        propsData: this.requiredStepProps,
        sync: false,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(wrapper.emitted()).toEqual({ back: [[]] });
    });

    it('should overwrite cancelEdition function', () => {
      const cancelEditionCustomMock = vi.fn();
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        pinia: this.pinia,
        propsData: this.requiredStepProps,
        sync: false,
        methods: { cancelEdition: cancelEditionCustomMock },
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(cancelEditionCustomMock).toHaveBeenCalledTimes(1);
    });
  }

  testResetSelectedIndex(
    initialState: Partial<VQBState> = buildStateWithOnePipeline(
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
  ) {
    it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
      setupMockStore(initialState);
      const initialStepIndex = this.store.selectedStepIndex;
      // selectedStepIndex is only available with store component
      const wrapper = mount(StoreStepFormComponent, {
        pinia: this.pinia,
        localVue: this.vue,
        propsData: { name: this.stepname },
        sync: false,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(this.store.selectedStepIndex).toEqual(initialStepIndex);

      wrapper.setProps({ initialStepValue: {} });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(this.store.selectedStepIndex).toEqual(initialStepIndex + 1);
    });
  }
}
