import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import { VueConstructor } from 'vue';
import Vuex, { Store } from 'vuex';

import BaseStepForm from '@/components/stepforms/StepForm.vue';
import { registerModule } from '@/store';
import { VQBState } from '@/store/state';

export type RootState = {
  vqb: VQBState;
};

export interface ValidationError {
  dataPath: string;
  keyword: string;
  message?: string;
}

export const localVue = createLocalVue();
localVue.use(Vuex);

export function setupMockStore(initialState: object = {}, plugins: any[] = []) {
  const store: Store<RootState> = new Vuex.Store({ plugins });
  registerModule(store, initialState);

  return store;
}

type ComponentType = typeof BaseStepForm;

type TestCaseConfiguration = {
  testlabel?: string;
  store?: Store<RootState>;
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

  constructor(componentType: ComponentType, stepname: string, vue?: VueConstructor) {
    this.componentType = componentType;
    this.stepname = stepname;
    this.vue = vue ?? localVue;
  }

  _mount(shallow: boolean, initialState: object = {}, optional: MountOptions = {}) {
    const mountfunc = shallow ? shallowMount : mount;
    const { propsData, data } = optional;
    const wrapper = mountfunc(this.componentType, {
      store: initialState ? setupMockStore(initialState) : undefined,
      propsData,
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
      .map((k, v) => `${v} ${k}`)
      .join(', ');
    it(`should generate ${specStr} components`, () => {
      const wrapper = this.shallowMount(initialState);
      for (const [componentName, count] of Object.entries(componentSpec)) {
        const compWrappers = wrapper.findAll(componentName);
        expect(compWrappers.length).toEqual(count);
      }
    });
  }

  async checkValidationError(
    _testlabel: any,
    store: any,
    propsData: any,
    data: any,
    expectedErrors: any,
  ) {
    const wrapper = mount(this.componentType, {
      store,
      propsData,
      localVue: this.vue,
      sync: false,
    });
    if (data) {
      wrapper.setData(data);
    }
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    await this.vue.nextTick();
    expect(errors).toEqual(expectedErrors);
  }

  testValidationErrors(configurations: ValidationErrorConfiguration[]) {
    const cases = configurations.map(({ testlabel, store, props, data, errors }) => [
      testlabel,
      store ?? setupMockStore(),
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
      const wrapper = mount(this.componentType, {
        store: store ?? setupMockStore(),
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
      const wrapper = mount(this.componentType, {
        store: store ?? setupMockStore(),
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
      const wrapper = mount(this.componentType, {
        store: store ?? setupMockStore(),
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

  testCancel(initialState: Partial<VQBState> = {}) {
    const store = setupMockStore(initialState);
    const initialPipeline = [...store.state.vqb.pipeline];
    const initialStepIndex = store.state.vqb.selectedStepIndex;

    it('should emit "back" event when back button is clicked', () => {
      const wrapper = mount(this.componentType, { store, localVue: this.vue, sync: false });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(wrapper.emitted()).toEqual({ back: [[]] });
      expect(store.state.vqb.selectedStepIndex).toEqual(initialStepIndex);
      expect(store.state.vqb.pipeline).toEqual(initialPipeline);
    });

    it('should overwrite cancelEdition function', () => {
      const cancelEditionCustomMock = jest.fn();
      const methods = { cancelEdition: cancelEditionCustomMock };
      const wrapper = mount(this.componentType, {
        store,
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
      initialState ?? {
        pipeline: [
          { name: 'domain', domain: 'foo' },
          { name: 'rename', oldname: 'foo', newname: 'bar' },
          { name: 'rename', oldname: 'baz', newname: 'spam' },
          { name: 'rename', oldname: 'tic', newname: 'tac' },
        ],
        selectedStepIndex: 2,
      },
    );
    const initialStepIndex = store.state.vqb.selectedStepIndex;

    it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
      const wrapper = mount(this.componentType, { store, localVue: this.vue, sync: false });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(store.state.vqb.selectedStepIndex).toEqual(initialStepIndex);
      wrapper.setProps({ isStepCreation: false });
      wrapper.find('.step-edit-form__back-button').trigger('click');
      expect(store.state.vqb.selectedStepIndex).toEqual(initialStepIndex + 1);
    });
  }
}
