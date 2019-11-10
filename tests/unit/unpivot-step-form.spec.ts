import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import { setupMockStore, RootState, ValidationError } from './utils';
import { Pipeline } from '@/lib/steps';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';


const localVue = createLocalVue();
localVue.use(Vuex);

describe('Unpivot Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have 3 input components', () => {
    const wrapper = shallowMount(UnpivotStepForm, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('multiselectwidget-stub');
    expect(autocompleteWrappers.length).toEqual(2);
    const checkboxWrappers = wrapper.findAll('checkboxwidget-stub');
    expect(checkboxWrappers.length).toEqual(1);
  });

  it('should pass down props to widgets', () => {
    const wrapper = shallowMount(UnpivotStepForm, {
      store: emptyStore,
      localVue,
      data: () => {
        return {
          editedStep: {
            name: 'unpivot',
            keep: ['foo', 'bar'],
            unpivot: ['baz'],
            unpivot_column_name: 'spam',
            value_column_name: 'eggs',
            dropna: false,
          },
        };
      },
    });
    expect(wrapper.find('#keepColumnInput').props('value')).toEqual(['foo', 'bar']);
    expect(wrapper.find('#unpivotColumnInput').props('value')).toEqual(['baz']);
    const widgetCheckbox = wrapper.find(CheckboxWidget);
    expect(widgetCheckbox.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(UnpivotStepForm, { store, localVue });
    expect(wrapper.find('#keepColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('#unpivotColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });

  describe('Errors', () => {
    it('should report errors when fields are missing', async () => {
      const wrapper = mount(UnpivotStepForm, { store: emptyStore, localVue });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );
      expect(errors).toEqual([
        { keyword: 'minItems', dataPath: '.keep' },
        { keyword: 'minItems', dataPath: '.unpivot' },
      ]);
    });
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(UnpivotStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'unpivot',
          keep: ['columnA', 'columnB'],
          unpivot: ['columnC'],
          dropna: true,
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'unpivot',
            keep: ['columnA', 'columnB'],
            unpivot: ['columnC'],
            unpivot_column_name: 'variable',
            value_column_name: 'value',
            dropna: true,
          },
        ],
      ],
    });
  });

  it('should emit "cancel" event when edition is cancelled', async () => {
    const wrapper = mount(UnpivotStepForm, { store: emptyStore, localVue });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ];
    const store = setupMockStore({
      pipeline,
      selectedStepIndex: 2,
    });
    const wrapper = mount(UnpivotStepForm, { store, localVue });
    wrapper.setProps({ isStepCreation: true });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(store.state.vqb.selectedStepIndex).toEqual(3);
  });
});
