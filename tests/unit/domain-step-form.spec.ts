import { expect } from 'chai';
import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import DomainStepForm from '@/components/stepforms/DomainStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('Domain Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(DomainStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).to.be.true;
  });

  it('should have exactly one widgetautocomplete component', () => {
    const wrapper = shallowMount(DomainStepForm, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetautocomplete-stub');

    expect(inputWrappers.length).to.equal(1);
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupStore({
      domains: ['foo', 'bar'],
    });
    const wrapper = shallowMount(DomainStepForm, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');

    expect(widgetAutocomplete.attributes('options')).to.equal('foo,bar');
  });

  it('should report errors when submitted data is not valid', () => {
    const wrapper = mount(DomainStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
      keyword: err.keyword,
      dataPath: err.dataPath,
    }));
    expect(errors).to.eql([{ keyword: 'minLength', dataPath: '.domain' }]);
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
    expect(wrapper.vm.$data.errors).to.be.null;
    expect(wrapper.emitted()).to.eql({
      formSaved: [[{ name: 'domain', domain: 'foo' }]],
    });
  });

  it('should emit "cancel" event when edition is cancelled', () => {
    const wrapper = mount(DomainStepForm, { store: emptyStore, localVue });
    wrapper.find('.widget-form-action__button--cancel').trigger('click');
    expect(wrapper.emitted()).to.eql({
      cancel: [[]],
    });
  });
});
