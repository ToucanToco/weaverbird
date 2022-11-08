import { describe, expect, it, vi } from 'vitest';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import ConcatenateStepForm from '@/components/stepforms/ConcatenateStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

vi.mock('@/components/FAIcon.vue');

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
        { dataPath: '.columns.0', keyword: 'minLength' },
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
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['tic', 'tac']] },
      ],
    },
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
    expect(picker2.props('value')).toEqual('bar');
  });
});
