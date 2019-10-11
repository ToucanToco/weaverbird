import { shallowMount, createLocalVue } from '@vue/test-utils';
import ToLowerStepForm from '@/components/stepforms/ToLowerStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('To Uppercase Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ToLowerStepForm, { store: emptyStore, localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 1 input component', () => {
    const wrapper = shallowMount(ToLowerStepForm, { store: emptyStore, localVue });

    expect(wrapper.findAll('columnpicker-stub').length).toEqual(1);
  });

  it('should display step column on edition', () => {
    const wrapper = shallowMount(ToLowerStepForm, {
      propsData: {
        initialStepValue: { name: 'lowercase', column: 'foo' },
      },
      store: emptyStore,
      localVue,
    });
    const columnPicker = wrapper.find('columnpicker-stub');
    expect(columnPicker.attributes('value')).toEqual('foo');
  });
});
