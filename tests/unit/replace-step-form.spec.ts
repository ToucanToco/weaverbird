import ReplaceStepForm from '@/components/stepforms/ReplaceStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Replace Step Form', () => {
  const runner = new BasicStepFormTestRunner(ReplaceStepForm, 'replace');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'listwidget-stub': 1,
  });
  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
        data: [],
      },
    }),
    props: {
      initialStepValue: { name: 'replace', search_column: 'foo', to_replace: [['hello', 'hi']] },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down "search_column" to ColumnPicker', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            to_replace: [['foo', 'bar']],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('columnpicker-stub').attributes().value).toEqual('test');
  });

  it('should pass down "to_replace" to ListWidget', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            to_replace: [['foo', 'bar']],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
  });

  it('should pass down the default "to_replace" to ListWidget', () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'replace',
            search_column: 'test',
            to_replace: [],
          },
        },
      },
    );
    expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
  });

  it('should convert input value to integer when the column data type is integer', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA', type: 'integer' }],
        data: [[null]],
      },
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'replace',
          search_column: 'columnA',
          to_replace: [['0', '42']],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[0, 42]] }]],
    });
  });

  it('should convert input value to float when the column data type is float', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA', type: 'float' }],
        data: [[null]],
      },
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'replace',
          search_column: 'columnA',
          to_replace: [['0', '42.3']],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[0, 42.3]] }]],
    });
  });

  it('should convert input value to boolean when the column data type is boolean', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA', type: 'boolean' }],
        data: [[null]],
      },
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'replace',
          search_column: 'columnA',
          to_replace: [['false', 'true']],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'replace', search_column: 'columnA', to_replace: [[false, true]] }]],
    });
  });
});
