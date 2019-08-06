import { createLocalVue, shallowMount, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import { BackendService, servicePluginFactory } from '@/store/backend-plugin';

import Pagination from '@/components/Pagination.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

const executePipelineMock = jest.fn();

class DummyService implements BackendService {
  listCollections() {
    return Promise.resolve({ data: ['foo', 'bar'] });
  }

  executePipeline(_pipeline: Pipeline, limit: number, offset: number) {
    executePipelineMock(limit, offset);
    return Promise.resolve({ data: { headers: [], data: [] } });
  }
}

describe('Pagination Component', () => {
  it('should instantiate', () => {
    const store = setupStore();
    const wrapper = shallowMount(Pagination, { localVue, store });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display correct number of pagination links', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
        data: [['Paris', 10000000, true], ['Marseille', 3000000, false]],
        paginationContext: {
          totalCount: 7,
          pageno: 1,
          pagesize: 2,
        },
      },
      pagesize: 2,
    });
    const wrapper = mount(Pagination, { localVue, store });
    const links = wrapper
      .findAll('.pagination__list li')
      .wrappers.map(lw => ({ classes: lw.classes(), text: lw.text() }));
    expect(links).toEqual([
      { text: 'Prev', classes: ['prevnext', 'disabled'] },
      { text: '1', classes: ['active'] },
      { text: '2', classes: [] },
      { text: '3', classes: [] },
      { text: '4', classes: [] },
      { text: 'Next', classes: ['prevnext'] },
    ]);
  });

  it('should call executePipeline with limit / offset on backend service', () => {
    const pagesize = 2;
    const store = setupStore(
      {
        dataset: {
          headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
          data: [['Paris', 10000000, true], ['Marseille', 3000000, false]],
          paginationContext: {
            totalCount: 7,
            pageno: 1,
            pagesize,
          },
        },
        pagesize,
      },
      [servicePluginFactory(new DummyService())],
    );
    const wrapper = mount(Pagination, { localVue, store });
    wrapper
      .findAll('.pagination__list li a')
      .at(3)
      .trigger('click');
    // click on "page 3" ⇒ offset = 4, limit = 2
    expect(executePipelineMock).toHaveBeenCalledWith(pagesize, pagesize * 2);
  });

  it('should instantiate the counter', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
        data: [['Paris', 10000000, true], ['Marseille', 3000000, false]],
        paginationContext: {
          totalCount: 7,
          pageno: 1,
          pagesize: 2,
        },
      },
      pagesize: 2,
    });
    const wrapper = mount(Pagination, { localVue, store });
    const wrapperCounter = wrapper.find('.pagination-counter');
    expect(wrapperCounter.exists()).toBeTruthy();
  });
});
