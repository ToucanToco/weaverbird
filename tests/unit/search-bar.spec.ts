import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import { ActionCategories } from '@/components/constants';
import SearchBar from '@/components/SearchBar.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('SearchBar', () => {
  it('should instantiate Multiselect', () => {
    const wrapper = shallowMount(SearchBar, { store: setupMockStore(), localVue });
    const multiselect = wrapper.findAll('multiselect-stub');
    expect(multiselect.length).toEqual(1);
  });

  it('should have the right options for mong36 translator', () => {
    const store = setupMockStore({ translator: 'mongo36' });
    const wrapper = shallowMount(SearchBar, {
      store,
      localVue,
    });
    const multiselect = wrapper.find('multiselect-stub');
    const multiselectOptions = new Set(
      multiselect.props('options').flatMap((e: ActionCategories) => e.actions.map(e => e.name)),
    );
    const expectedOptions = new Set([
      'delete',
      'select',
      'filter',
      'top',
      'argmax',
      'argmin',
      'dateextract',
      'formula',
      'percentage',
      'aggregate',
      'todate',
      'fromdate',
      'pivot',
      'unpivot',
      'concatenate',
      'split',
      'substring',
      'text',
      'lowercase',
      'uppercase',
      'duplicate',
      'fillna',
      'rank',
      'rename',
      'replace',
      'sort',
      'append',
      'join',
      'custom',
      'uniquegroups',
      'rollup',
      'evolution',
      'cumsum',
    ]);
    expect(multiselectOptions).toEqual(expectedOptions);
  });

  it('should have the right options for mongo40 translator', () => {
    const store = setupMockStore({ translator: 'mongo40' });
    const wrapper = shallowMount(SearchBar, {
      store,
      localVue,
    });
    const multiselect = wrapper.find('multiselect-stub');
    const multiselectOptions = new Set(
      multiselect.props('options').flatMap((e: ActionCategories) => e.actions.map(e => e.name)),
    );
    const expectedOptions = new Set([
      'delete',
      'select',
      'filter',
      'top',
      'argmax',
      'argmin',
      'dateextract',
      'formula',
      'percentage',
      'aggregate',
      'todate',
      'fromdate',
      'pivot',
      'unpivot',
      'concatenate',
      'split',
      'substring',
      'text',
      'lowercase',
      'uppercase',
      'duplicate',
      'fillna',
      'rank',
      'rename',
      'replace',
      'sort',
      'convert',
      'append',
      'join',
      'custom',
      'uniquegroups',
      'rollup',
      'evolution',
      'cumsum',
    ]);
    expect(multiselectOptions).toEqual(expectedOptions);
  });

  it('should display the right option into multiselect', () => {
    const wrapper = mount(SearchBar, {
      store: setupMockStore(),
      localVue,
      propsData: {
        type: 'compute',
        actions: [{ name: 'text', label: 'Add text column' }],
      },
    });
    const multiselect = wrapper.findAll('.multiselect__option');
    expect(
      multiselect
        .at(1)
        .find('span span')
        .text(),
    ).toEqual('Add text column');
  });

  it('should emit "actionClicked" when an option multiselect is clicked', () => {
    const wrapper = mount(SearchBar, { store: setupMockStore(), localVue });
    const multiselectOption = wrapper.findAll('.multiselect__option');
    multiselectOption.at(1).trigger('click');
    expect(wrapper.emitted().actionClicked[0]).toEqual(['text']);
  });
});
