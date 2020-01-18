import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import SortStepForm from '@/components/stepforms/SortStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Sort Step Form', () => {
  const runner = new BasicStepFormTestRunner(SortStepForm, 'sort', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({ 'listwidget-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'a column parameter is an empty string',
      props: {
        editedStep: {
          name: 'sort',
          columns: [{ column: '', order: 'desc' }],
        },
      },
      errors: [{ keyword: 'minLength', dataPath: '.columns[0].column' }],
    },
  ]);

  runner.testValidate(
    {
      testlabel: 'submitted data is validd',
      data: {
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      },
    },
    {
      name: 'sort',
      columns: [{ column: 'amazing', order: 'desc' }],
    },
  );

  runner.testCancel({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  describe('ListWidget', () => {
    let emptyStore: Store<RootState>;
    beforeEach(() => {
      emptyStore = setupMockStore({});
    });

    it('should pass the defaultSortColumn props to widgetList', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([{ column: '', order: 'asc' }]);
    });

    it('should pass right sort props to widgetList sort column', async () => {
      const wrapper = shallowMount(SortStepForm, { store: emptyStore, localVue, sync: false });
      wrapper.setData({
        editedStep: {
          name: 'sort',
          columns: [{ column: 'amazing', order: 'desc' }],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'amazing', order: 'desc' },
      ]);
    });
  });
});
