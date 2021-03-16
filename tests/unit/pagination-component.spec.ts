import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import Pagination from '@/components/Pagination.vue';
import { BackendService } from '@/lib/backend';
import { Pipeline } from '@/lib/steps';
import { PipelinesScopeContext } from '@/store/utils/dereference-pipeline';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

const executePipelineMock = jest.fn();

class DummyService implements BackendService {
  listCollections() {
    return Promise.resolve({ data: ['foo', 'bar'] });
  }

  executePipeline(
    _pipeline: Pipeline,
    _pipelines: PipelinesScopeContext,
    limit: number,
    offset: number,
  ) {
    executePipelineMock(limit, offset);
    return Promise.resolve({ data: { headers: [], data: [] } });
  }
}

describe('Pagination Component', () => {
  it('should instantiate', () => {
    const store = setupMockStore();
    const wrapper = shallowMount(Pagination, { localVue, store });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display correct number of pagination links', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
        data: [
          ['Paris', 10000000, true],
          ['Marseille', 3000000, false],
        ],
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
    const store = setupMockStore({
      ...buildStateWithOnePipeline([{ name: 'domain', domain: 'foo' }], {
        dataset: {
          headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
          data: [
            ['Paris', 10000000, true],
            ['Marseille', 3000000, false],
          ],
          paginationContext: {
            totalCount: 7,
            pageno: 1,
            pagesize,
          },
        },
        pagesize,
      }),
      backendService: new DummyService(),
    });
    const wrapper = mount(Pagination, { localVue, store });
    wrapper
      .findAll('.pagination__list li a')
      .at(3)
      .trigger('click');
    // click on "page 3" ⇒ offset = 4, limit = 2
    expect(executePipelineMock).toHaveBeenCalledWith(pagesize, pagesize * 2);
  });

  it('should instantiate the counter', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
        data: [
          ['Paris', 10000000, true],
          ['Marseille', 3000000, false],
        ],
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

  it('should hide the pagination navigation if there is only one page', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
        data: [
          ['Paris', 10000000, true],
          ['Marseille', 3000000, false],
        ],
        paginationContext: {
          totalCount: 2,
          pageno: 1,
          pagesize: 2,
        },
      },
      pagesize: 2,
    });
    const wrapper = mount(Pagination, { localVue, store });
    expect(wrapper.find('.pagination__list').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__current-min').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__current-max').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__total-count').text()).toEqual('2 rows');
  });
  describe('Pagination navigation lifecycle', () => {
    const pagesize = 50;
    const totalCount = 400;
    const paginationNavigationExistsOnpageIndex = function(pageno: number): boolean {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'city' }, { name: 'population' }, { name: 'isCapitalCity' }],
          data: [
            ['Paris', 10000000, true],
            ['Marseille', 3000000, false],
          ],
          paginationContext: {
            totalCount,
            pagesize,
            pageno,
          },
        },
        pagesize,
      });
      const wrapper = mount(Pagination, { localVue, store });
      return wrapper.find('.pagination__list').exists();
    };
    it('should display pagination navigation on first page', () => {
      const pageIndex = 1;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
    it('should display pagination navigation on any middle page', () => {
      const pageIndex = totalCount / pagesize - 2;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
    it('should display pagination navigation on last page', () => {
      const pageIndex = totalCount / pagesize;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
  });
});
