import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import SearchBar from '@/components/SearchBar.vue';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('SearchBar', () => {
  it('should instantiate Multiselect', () => {
    const wrapper = shallowMount(SearchBar);
    const multiselect = wrapper.findAll('multiselect-stub');
    expect(multiselect.exists()).toBeTruthy();
  });

  it('should display the right option into multiselect', () => {
    const wrapper = mount(SearchBar, {
      propsData: {
        type: 'compute',
        actions: [{ name: 'percentage', label: 'Percentage of total' }],
      },
    });
    const multiselect = wrapper.findAll('.multiselect__option');
    expect(
      multiselect
        .at(1)
        .find('span span')
        .text(),
    ).to.equal('Percentage of total');
  });

  it('should emit "actionClicked" when an option multiselect is clicked', () => {
    const wrapper = mount(SearchBar);
    const multiselectOption = wrapper.findAll('.multiselect__option');
    multiselectOption.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['percentage']);
  });
});
