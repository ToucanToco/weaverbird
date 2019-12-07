import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import SubstringStepForm from '@/components/stepforms/SubstringStepForm.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Substring Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(SubstringStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('substring');
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(SubstringStepForm, { store: emptyStore, localVue });
    expect(wrapper.find('#column').exists()).toBeTruthy();
    expect(wrapper.find('#startIndex').exists()).toBeTruthy();
    expect(wrapper.find('#endIndex').exists()).toBeTruthy();
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(SubstringStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'Substring', column: 'foo', start_index: 1, end_index: 3 },
    });
    await localVue.nextTick();
    expect(wrapper.find('#startIndex').props('value')).toEqual(1);
    expect(wrapper.find('#endIndex').props('value')).toEqual(3);
  });

  it('should report errors when column is empty', async () => {
    const wrapper = mount(SubstringStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    const errors = wrapper.vm.$data.errors
      .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
      .sort((err1: ValidationError, err2: ValidationError) =>
        err1.dataPath.localeCompare(err2.dataPath),
      );
    expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.column' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(SubstringStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'substring',
          column: 'foo',
          start_index: 1,
          end_index: 3,
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'substring', column: 'foo', start_index: 1, end_index: 3 }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(SubstringStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });
});
