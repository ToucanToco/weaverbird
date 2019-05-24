import { shallowMount, createLocalVue } from '@vue/test-utils';
import FormRenameStep from '@/components/FormRenameStep.vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';

const localVue = createLocalVue();
localVue.use(Vuex);

const emptyStore = setupStore({});

describe('Form Rename Step', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly one widgetinputtext component', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    const inputWrappers = wrapper.findAll('widgetinputtext-stub');

    expect(inputWrappers.length).toEqual(1);
  });

  it('should pass down the newname prop to widget value prop', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });
    wrapper.setData({ step: { oldname: '', newname: 'foo' } });

    expect(wrapper.find('widgetinputtext-stub').props('value')).toEqual('foo');
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(FormRenameStep, { store: emptyStore, localVue });

    expect(wrapper.find('widgetautocomplete-stub').exists()).toBeTruthy();
  });

  it('should instantiate an autocomplet widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FormRenameStep, { store, localVue });
    const widgetAutocomplete = wrapper.find('widgetautocomplete-stub');

    expect(widgetAutocomplete.attributes('options')).toEqual('columnA,columnB,columnC');
  });
});
