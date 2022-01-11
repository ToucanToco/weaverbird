import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import DataTypesMenu from '@/components/DataTypesMenu.vue';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Data Types Menu', () => {
  it('should instantiate with the popover', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'text' }],
      },
    });
    const wrapper = mount(DataTypesMenu, { store, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).toContain('weaverbird-popover');
  });

  it('should contain the right set of data types', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'string' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: {
        columnName: 'columnA',
      },
    });
    const options = wrapper.findAll('.data-types-menu__option--active');
    expect(options.at(0).html()).toContain('Integer');
    expect(options.at(1).html()).toContain('Float');
    expect(options.at(2).html()).toContain('Text');
    expect(options.at(3).html()).toContain('Date');
    expect(options.at(4).html()).toContain('Boolean');
  });

  it('should deactivate the date option when the column is not a string or an integer', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: {
        columnName: 'columnA',
      },
    });
    const activatedOptions = wrapper.findAll('.data-types-menu__option--active');
    expect(activatedOptions.length).toEqual(4);
    const deactivatedOptions = wrapper.findAll('.data-types-menu__option--deactivated');
    expect(deactivatedOptions.length).toEqual(1);
    expect(deactivatedOptions.at(0).html()).toContain('Date');
  });

  it('should have the date option when the column is an integer', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'integer' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: {
        columnName: 'columnA',
      },
    });
    const activatedOptions = wrapper.findAll('.data-types-menu__option--active');
    expect(activatedOptions.length).toEqual(5);
    const deactivatedOptions = wrapper.findAll('.data-types-menu__option--deactivated');
    expect(deactivatedOptions.length).toEqual(0);
  });

  it('should have the date option when the column is a date', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'date' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: {
        columnName: 'columnA',
      },
    });
    const activatedOptions = wrapper.findAll('.data-types-menu__option--active');
    expect(activatedOptions.length).toEqual(5);
    const deactivatedOptions = wrapper.findAll('.data-types-menu__option--deactivated');
    expect(deactivatedOptions.length).toEqual(0);
  });

  describe('when clicking on a data type', () => {
    it('should add a valid convert step in the pipeline and select it', async () => {
      const store = setupMockStore(
        buildStateWithOnePipeline(
          [
            { name: 'domain', domain: 'test' },
            { name: 'delete', columns: ['test'] },
          ],
          {
            selectedStepIndex: 0,
          },
        ),
      );
      const wrapper = shallowMount(DataTypesMenu, {
        store,
        localVue,
        propsData: {
          columnName: 'columnA',
        },
      });
      const actionsWrapper = wrapper.findAll('.data-types-menu__option--active');
      actionsWrapper.at(0).trigger('click');
      await localVue.nextTick();
      expect(store.getters[VQBnamespace('pipeline')]).toEqual([
        { name: 'domain', domain: 'test' },
        { name: 'convert', columns: ['columnA'], data_type: 'integer' },
        { name: 'delete', columns: ['test'] },
      ]);
      expect(store.state.vqb.selectedStepIndex).toEqual(1);
    });

    it('should close any existing open form if another step was being edited', async () => {
      const store = setupMockStore({
        ...buildStateWithOnePipeline([{ name: 'domain', domain: 'test' }], {
          currentStepFormName: 'formula',
        }),
      });
      const wrapper = shallowMount(DataTypesMenu, { store, localVue });
      const actionsWrapper = wrapper.find('.data-types-menu__option--active');
      actionsWrapper.trigger('click');
      await localVue.nextTick();
      expect(wrapper.vm.$store.state.currentStepFormName).toBeUndefined();
    });

    it('should emit a close event', async () => {
      const store = setupMockStore();
      const wrapper = shallowMount(DataTypesMenu, { store, localVue });
      const actionsWrapper = wrapper.findAll('.data-types-menu__option--active');
      actionsWrapper.at(0).trigger('click');
      await localVue.nextTick();
      expect(wrapper.emitted().closed).toBeTruthy();
    });

    it('should not emit a close event if clicking on a deactivated option', async () => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA', type: 'float' }],
        },
      });
      const wrapper = shallowMount(DataTypesMenu, {
        store,
        localVue,
        propsData: {
          columnName: 'columnA',
        },
      });
      wrapper.find('.data-types-menu__option--deactivated').trigger('click');
      await localVue.nextTick();
      expect(wrapper.emitted().closed).toBeFalsy();
    });
  });

  it('should emit "closed" and actionClicked" with "todate" as payload when clicking \
  on "date" on a string column', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'string' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: {
        columnName: 'columnA',
      },
    });
    const options = wrapper.findAll('.data-types-menu__option--active');
    options.at(3).trigger('click');
    expect(wrapper.emitted().closed).toBeTruthy();
    expect(wrapper.emitted().actionClicked).toBeTruthy();
    expect(wrapper.emitted().actionClicked[0][0]).toEqual('todate');
  });

  it('should call createConvertStep when clicking on "date" on a date column', async () => {
    const createConvertStepStub = jest.fn();
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'date' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: { columnName: 'columnA' },
    });
    wrapper.setMethods({ createConvertStep: createConvertStepStub });
    const actionsWrapper = wrapper.findAll('.data-types-menu__option--active');
    actionsWrapper.at(3).trigger('click');
    await localVue.nextTick();
    expect(createConvertStepStub).toBeCalledWith('date');
  });

  it('should call createConvertStep when clicking on "date" on a integer column', async () => {
    const createConvertStepStub = jest.fn();
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'integer' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: { columnName: 'columnA' },
    });
    wrapper.setMethods({ createConvertStep: createConvertStepStub });
    const actionsWrapper = wrapper.findAll('.data-types-menu__option--active');
    actionsWrapper.at(3).trigger('click');
    await localVue.nextTick();
    expect(createConvertStepStub).toBeCalledWith('date');
  });

  it('should not call createConvertStep when clicking on "date" on a float column', async () => {
    const createConvertStepStub = jest.fn();
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
      },
    });
    const wrapper = shallowMount(DataTypesMenu, {
      store,
      localVue,
      propsData: { columnName: 'columnA' },
    });
    wrapper.setMethods({ createConvertStep: createConvertStepStub });
    wrapper.find('.data-types-menu__option--deactivated').trigger('click');
    await localVue.nextTick();
    expect(createConvertStepStub).not.toHaveBeenCalled();
  });
});
