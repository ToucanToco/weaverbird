import IfThenElseStepForm from '@/components/stepforms/IfThenElseStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe.only('If...Then...Else Step Form', () => {
  const runner = new BasicStepFormTestRunner(IfThenElseStepForm, 'ifthenelse');

  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'ifthenelsewidget-stub': 1,
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
          name: 'ifthenelse',
          newColumn: '',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
      errors: [
        {
          dataPath: '.else',
          keyword: 'minLength',
        },
        {
          dataPath: '.else',
          keyword: 'type',
        },
        {
          dataPath: '.else',
          keyword: 'anyOf',
        },
        {
          dataPath: '.if',
          keyword: 'if',
        },
        {
          dataPath: '.if.column',
          keyword: 'minLength',
        },
        {
          dataPath: '.if.value',
          keyword: 'minLength',
        },
        {
          dataPath: '.newColumn',
          keyword: 'minLength',
        },
        {
          dataPath: '.then',
          keyword: 'minLength',
        },
      ],
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
        name: 'ifthenelse',
        newColumn: 'new',
        if: { column: 'foo', value: 'bar', operator: 'eq' },
        then: '123',
        else: '456',
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  describe('Warning new column name', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'ifthenelse',
          newColumn: 'columnA',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if new_column is not an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'ifthenelse',
          newColumn: 'columnB',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toBeNull();
    });
  });

  it('should update editedStep with the if...then...else object', () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'ifthenelse',
          newColumn: '',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
    });
    wrapper.find('ifthenelsewidget-stub').vm.$emit('input', {
      if: { column: 'foo', value: 'bar', operator: 'eq' },
      then: '123',
      else: '456',
    });
    expect(wrapper.vm.$data.editedStep).toEqual({
      name: 'ifthenelse',
      newColumn: '',
      if: { column: 'foo', value: 'bar', operator: 'eq' },
      then: '123',
      else: '456',
    });
  });

  describe('Data type conversion', () => {
    it('should convert input value to integer when the column data type is integer', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA', type: 'integer' }],
          data: [[null]],
        },
      };
      const wrapper = runner.mount(initialState, {
        propsData: {
          initialStepValue: {
            name: 'ifthenelse',
            newColumn: 'test',
            if: {
              and: [
                { column: 'columnA', operator: 'gt', value: '10' },
                { column: 'columnA', operator: 'in', value: ['0', '42'] },
              ],
            },
            then: '123',
            else: {
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: '20' },
                  { column: 'columnA', operator: 'in', value: ['1', '66'] },
                ],
              },
              then: '456',
              else: {
                if: {
                  and: [
                    { column: 'columnA', operator: 'gt', value: '30' },
                    { column: 'columnA', operator: 'in', value: ['2', '69'] },
                  ],
                },
                then: '789',
                else: '000',
              },
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
              name: 'ifthenelse',
              newColumn: 'test',
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: 10 },
                  { column: 'columnA', operator: 'in', value: [0, 42] },
                ],
              },
              then: '123',
              else: {
                if: {
                  and: [
                    { column: 'columnA', operator: 'gt', value: 20 },
                    { column: 'columnA', operator: 'in', value: [1, 66] },
                  ],
                },
                then: '456',
                else: {
                  if: {
                    and: [
                      { column: 'columnA', operator: 'gt', value: 30 },
                      { column: 'columnA', operator: 'in', value: [2, 69] },
                    ],
                  },
                  then: '789',
                  else: '000',
                },
              },
            },
          ],
        ],
      });
    });

    it('should convert input value to integer when the column data type is float', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA', type: 'float' }],
          data: [[null]],
        },
      };
      const wrapper = runner.mount(initialState, {
        propsData: {
          initialStepValue: {
            name: 'ifthenelse',
            newColumn: 'test',
            if: {
              and: [
                { column: 'columnA', operator: 'gt', value: '10.3' },
                { column: 'columnA', operator: 'in', value: ['0', '42.1'] },
              ],
            },
            then: '123',
            else: {
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: '10.3' },
                  { column: 'columnA', operator: 'in', value: ['0', '42.1'] },
                ],
              },
              then: '456',
              else: '789',
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
              name: 'ifthenelse',
              newColumn: 'test',
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: 10.3 },
                  { column: 'columnA', operator: 'in', value: [0, 42.1] },
                ],
              },
              then: '123',
              else: {
                if: {
                  and: [
                    { column: 'columnA', operator: 'gt', value: 10.3 },
                    { column: 'columnA', operator: 'in', value: [0, 42.1] },
                  ],
                },
                then: '456',
                else: '789',
              },
            },
          ],
        ],
      });
    });

    it('should convert input value to integer when the column data type is boolean', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA', type: 'boolean' }],
          data: [[null]],
        },
      };
      const wrapper = runner.mount(initialState, {
        propsData: {
          initialStepValue: {
            name: 'ifthenelse',
            newColumn: 'test',
            if: {
              and: [
                { column: 'columnA', operator: 'gt', value: 'true' },
                { column: 'columnA', operator: 'in', value: ['True', 'False'] },
              ],
            },
            then: '123',
            else: {
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: 'True' },
                  { column: 'columnA', operator: 'in', value: ['true', 'false'] },
                ],
              },
              then: '456',
              else: '789',
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
              name: 'ifthenelse',
              newColumn: 'test',
              if: {
                and: [
                  { column: 'columnA', operator: 'gt', value: true },
                  { column: 'columnA', operator: 'in', value: [true, false] },
                ],
              },
              then: '123',
              else: {
                if: {
                  and: [
                    { column: 'columnA', operator: 'gt', value: true },
                    { column: 'columnA', operator: 'in', value: [true, false] },
                  ],
                },
                then: '456',
                else: '789',
              },
            },
          ],
        ],
      });
    });
  });
});
