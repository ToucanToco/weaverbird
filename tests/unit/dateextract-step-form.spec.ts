import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import DateExtractStepForm from '@/components/stepforms/DateExtractStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('DateExtract Step Form', () => {
  const runner = new BasicStepFormTestRunner(DateExtractStepForm, 'dateextract');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'autocompletewidget-stub': 1,
    'inputtextwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      props: {
        initialStepValue: {
          name: 'dateextract',
          column: '',
          operation: 'oopsie',
        },
      },
      errors: [
        {
          keyword: 'minLength',
          dataPath: '.column',
        },
        {
          keyword: 'enum',
          dataPath: '.operation',
        },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'date' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null], [null]],
      },
    }),
    props: {
      initialStepValue: {
        name: 'dateextract',
        column: 'foo',
        operation: 'minutes',
        new_column_name: 'the minutes',
      },
    },
  });

  runner.testValidate(
    {
      testlabel: 'new_column_name is generated correctly',
      store: setupMockStore({
        dataset: {
          headers: [
            { name: 'foo', type: 'date' },
            { name: 'foo_minutes', type: 'string' },
          ],
          data: [[null], [null]],
        },
      }),
      props: {
        initialStepValue: {
          name: 'dateextract',
          column: 'foo',
          operation: 'minutes',
        },
      },
    },
    {
      name: 'dateextract',
      column: 'foo',
      operation: 'minutes',
      new_column_name: 'foo_minutes1',
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

  runner.testResetSelectedIndex();

  describe('NewColumn input text widget', () => {
    it('should pass down the "dateextract" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(
        {},
        {
          data: {
            editedStep: {
              name: 'dateextract',
              column: 'foo',
              operation: 'day',
              new_column_name: 'bar',
            },
          },
        },
      );
      await wrapper.vm.$nextTick();
      expect(wrapper.find('inputtextwidget-stub').props('value')).toEqual('bar');
      expect(wrapper.find('inputtextwidget-stub').props().placeholder).toEqual(
        'Enter a column name (default is foo_day)',
      );
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
          name: 'dateextract',
          column: 'foo',
          operation: 'minutes',
          new_column_name: 'baz',
        },
        isStepCreation: false,
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedStepIndex).toEqual(1);
    const columnPickers = wrapper.findAll(ColumnPicker);
    expect(columnPickers.length).toEqual(1);
    const [picker1] = columnPickers.wrappers;
    expect(picker1.props('value')).toEqual('foo');
    expect(picker1.vm.$data.column).toEqual('foo');
  });
});
