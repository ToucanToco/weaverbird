import { shallowMount, createLocalVue } from '@vue/test-utils';
import ToUpperStepForm from '@/components/stepforms/ToUpperStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('To Uppercase Step Form', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ToUpperStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 1 input component', () => {
    const wrapper = shallowMount(ToUpperStepForm, { store: emptyStore, localVue });

    expect(wrapper.findAll('columnpicker-stub').length).toEqual(1);
  });

  it('should display step column on edition', () => {
    const wrapper = shallowMount(ToUpperStepForm, {
      propsData: {
        initialStepValue: { name: 'uppercase', column: 'foo' },
      },
      store: emptyStore,
      localVue,
    });
    const columnPicker = wrapper.find('columnpicker-stub');
    expect(columnPicker.attributes('value')).toEqual('foo');
  });
});
