import FilterStepForm from '@/components/stepforms/FilterStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner } from './utils';

describe('Filter Step Form', () => {
  const runner = new BasicStepFormTestRunner(FilterStepForm, 'filter');
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
      data: {
        editedStep: {
          name: 'filter',
          condition: { and: [] },
        },
      },
      errors: [{ keyword: 'minItems', dataPath: '.condition.and' }],
    },
  ]);

  runner.testValidate({
    store: setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
    }),
    props: {
      initialStepValue: {
        name: 'filter',
        condition: {
          and: [
            { column: 'foo', value: 'bar', operator: 'gt' },
            { column: 'foo', value: ['bar', 'toto'], operator: 'nin' },
          ],
        },
      },
    },
  });

  runner.testCancel();

  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  it('should get a specific class when there is more than one condition to filter-form container', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'filter',
            condition: {
              and: [
                { column: 'foo', value: 'bar', operator: 'gt' },
                { column: 'yolo', value: 'carpe diem', operator: 'nin' },
              ],
            },
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.classes()).toContain('filter-form--multiple-conditions');
  });

  describe('ListWidget', () => {
    it('should pass down the "condition" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'filter',
            condition: { and: [{ column: 'foo', value: 'bar', operator: 'gt' }] },
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', value: 'bar', operator: 'gt' },
      ]);
    });
  });

  it('should use selected column at creation', () => {
    const initialState = {
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null]],
      },
      selectedColumns: ['bar'],
    };
    const wrapper = runner.mount(initialState);
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('bar');
  });

  it('should have no default column if no selected column', () => {
    const initialState = {
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null]],
      },
    };
    const wrapper = runner.mount(initialState);
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('');
  });

  it('should not use selected column on edition', () => {
    const initialState = {
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'bar', type: 'string' },
        ],
        data: [[null]],
      },
      selectedColumns: ['bar'],
    };
    const wrapper = runner.mount(initialState, {
      propsData: {
        isStepCreation: false,
        initialStepValue: {
          name: 'filter',
          condition: {
            and: [{ column: 'foo', value: 'bar', operator: 'gt' }],
          },
        },
      },
    });
    // we're editing an existing step with column `foo`, therefore even if the
    // column `bar` is selected in the interface, the step column should remain
    // `foo`.
    expect(wrapper.vm.$data.editedStep.condition.and[0].column).toEqual('foo');
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
          name: 'filter',
          condition: {
            and: [
              { column: 'columnA', operator: 'gt', value: '10' },
              { column: 'columnA', operator: 'in', value: ['0', '42'] },
            ],
          },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'gt', value: 10 },
                { column: 'columnA', operator: 'in', value: [0, 42] },
              ],
            },
          },
        ],
      ],
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
          name: 'filter',
          condition: {
            and: [
              { column: 'columnA', operator: 'gt', value: '10.3' },
              { column: 'columnA', operator: 'in', value: ['0', '42.1'] },
            ],
          },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'gt', value: 10.3 },
                { column: 'columnA', operator: 'in', value: [0, 42.1] },
              ],
            },
          },
        ],
      ],
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
          name: 'filter',
          condition: {
            and: [
              { column: 'columnA', operator: 'eq', value: 'true' },
              { column: 'columnA', operator: 'in', value: ['True', 'False'] },
            ],
          },
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'filter',
            condition: {
              and: [
                { column: 'columnA', operator: 'eq', value: true },
                { column: 'columnA', operator: 'in', value: [true, false] },
              ],
            },
          },
        ],
      ],
    });
  });
});
