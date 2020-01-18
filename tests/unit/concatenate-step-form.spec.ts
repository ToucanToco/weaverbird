import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ConcatenateStepForm from '@/components/stepforms/ConcatenateStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner, RootState } from './utils';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Concatenate Step Form', () => {
  const runner = new BasicStepFormTestRunner(ConcatenateStepForm, 'concatenate', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'listwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'foo', type: 'string' }],
          data: [[null]],
        },
      }),
      errors: [
        { dataPath: '.columns[0]', keyword: 'minLength' },
        { dataPath: '.new_column_name', keyword: 'minLength' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null], [null]],
      },
    }),
    props: {
      initialStepValue: {
        name: 'concatenate',
        columns: ['foo', 'bar'],
        separator: '-',
        new_column_name: 'new',
      },
    },
  });

  runner.testCancel({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex();

  describe('ListWidget', () => {
    let emptyStore: Store<RootState>;
    beforeEach(() => {
      emptyStore = setupMockStore({});
    });

    it('should pass down the "toConcatenate" prop to the ListWidget value prop', async () => {
      const wrapper = shallowMount(ConcatenateStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'concatenate',
          columns: ['foo', 'bar'],
          separator: '-',
          new_column_name: 'new',
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual(['foo', 'bar']);
    });
  });

  it('should not sync selected columns on edition', async () => {
    const store = setupMockStore({
      selectedStepIndex: 1,
      selectedColumns: ['spam'],
    });
    const wrapper = mount(ConcatenateStepForm, {
      store,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'concatenate',
          columns: ['foo', 'bar'],
          separator: '-',
          new_column_name: 'baz',
        },
        isStepCreation: false,
      },
    });
    await localVue.nextTick();
    expect(store.state.vqb.selectedStepIndex).toEqual(1);
    const columnPickers = wrapper.findAll(ColumnPicker);
    expect(columnPickers.length).toEqual(2);
    const [picker1, picker2] = columnPickers.wrappers;
    expect(picker1.props('value')).toEqual('foo');
    expect(picker1.vm.$data.column).toEqual('foo');
    expect(picker2.props('value')).toEqual('bar');
    expect(picker2.vm.$data.column).toEqual('bar');
  });
});
