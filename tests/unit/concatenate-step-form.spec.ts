import ConcatenateStepForm from '@/components/stepforms/ConcatenateStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner } from './utils';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';

describe('Concatenate Step Form', () => {
  const runner = new BasicStepFormTestRunner(ConcatenateStepForm, 'concatenate');
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
    it('should pass down the "toConcatenate" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(
        {},
        {
          data: {
            editedStep: {
              name: 'concatenate',
              columns: ['foo', 'bar'],
              separator: '-',
              new_column_name: 'new',
            },
          },
        },
      );
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual(['foo', 'bar']);
    });
  });

  it('should not sync selected columns on edition', async () => {
    const initialState = {
      selectedStepIndex: 1,
      selectedColumns: ['spam'],
    };
    const wrapper = runner.mount(initialState, {
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
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedStepIndex).toEqual(1);
    const columnPickers = wrapper.findAll(ColumnPicker);
    expect(columnPickers.length).toEqual(2);
    const [picker1, picker2] = columnPickers.wrappers;
    expect(picker1.props('value')).toEqual('foo');
    expect(picker1.vm.$data.column).toEqual('foo');
    expect(picker2.props('value')).toEqual('bar');
    expect(picker2.vm.$data.column).toEqual('bar');
  });
});
