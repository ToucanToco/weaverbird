import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import DomainStepForm from '@/components/stepforms/DomainStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Domain Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(DomainStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('domain');
  });

  it('should have exactly one widgetautocomplete component', () => {
    const wrapper = shallowMount(DomainStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('autocompletewidget-stub');

    expect(inputWrappers.length).toEqual(1);
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      domains: ['foo', 'bar'],
    });
    const wrapper = shallowMount(DomainStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('autocompletewidget-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('foo,bar');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(DomainStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).toEqual([{ keyword: 'minLength', dataPath: '.domain' }]);
  });

  it('should validate and emit "formSaved" when submitted data is valid', () => {
    const wrapper = mount(DomainStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: { name: 'domain', domain: 'foo' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'domain', domain: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(DomainStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).toEqual({
      cancel: [[]],
    });
  });
});
