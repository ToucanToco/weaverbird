import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it, test, vi } from 'vitest';
import type { VueConstructor } from 'vue';

import type BaseStepForm from '@/components/stepforms/StepForm.vue';
import type { ValidationError } from '@/lib/translators/base';

vi.mock('@/components/FAIcon.vue');

export const localVue = createLocalVue();

type ComponentType = typeof BaseStepForm;

type TestCaseConfiguration = {
  testlabel?: string;
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

  requiredStepProps = {
    columnTypes: {},
    interpolateFunc: (a: any) => a,
    getColumnNamesFromPipeline: () => Promise.resolve([]),
  };

  constructor(componentType: ComponentType, stepname: string, vue?: VueConstructor) {
    this.componentType = componentType;
    this.stepname = stepname;
    this.vue = vue ?? localVue;
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
    });
    if (data) {
      wrapper.setData(data);
    }
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await this.vue.nextTick();
    const wrapperErrors = wrapper.vm.$data.errors ?? [];
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
        expect(wrapper.vm.$data.errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });

      it(`shortcut ctrl+enter version`, async () => {
        const wrapper = mount(this.componentType, {
          localVue: this.vue,
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
        expect(wrapper.vm.$data.errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });

      it(`shortcut command+enter version`, async () => {
        const wrapper = mount(this.componentType, {
          localVue: this.vue,
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
        expect(wrapper.vm.$data.errors).toBeNull();
        expect(wrapper.emitted().formSaved).toEqual([[expectedEmit]]);
      });
    });
  }

  testCancel() {
    it('should emit "back" event when back button is clicked', () => {
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        propsData: this.requiredStepProps,
        sync: false,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(wrapper.emitted()).toEqual({ back: [[]] });
    });

    it('should overwrite cancelEdition function', () => {
      const cancelEditionCustomMock = vi.fn();
      const methods = { cancelEdition: cancelEditionCustomMock };
      const wrapper = mount(this.componentType, {
        localVue: this.vue,
        propsData: this.requiredStepProps,
        sync: false,
        methods,
      });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(cancelEditionCustomMock).toHaveBeenCalledTimes(1);
    });
  }
}
