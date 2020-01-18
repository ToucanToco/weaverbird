import FillnaStepForm from '@/components/stepforms/FillnaStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner } from './utils';

import { VQBnamespace } from '@/store';

describe('Fillna Step Form', () => {
  const runner = new BasicStepFormTestRunner(FillnaStepForm, 'fillna');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'columnpicker-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [[null]],
        },
      }),
      data: {
        editedStep: { name: 'fillna', column: 'columnA', value: { foo: 'bar' } },
      },
      errors: [{ dataPath: '.value', keyword: 'type' }],
    },
  ]);

  runner.testValidate({
    store: setupMockStore({
      dataset: {
        headers: [{ name: 'foo' }],
        data: [[null]],
      },
    }),
    props: {
      initialStepValue: { name: 'fillna', column: 'foo', value: 'bar' },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { column: '', value: 'foo' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('inputtextwidget-stub').props('value')).toEqual('foo');
  });

  it('should convert input value to integer when the column data type is integer', () => {
    const wrapper = runner.mount(
      {
        dataset: {
          headers: [{ name: 'columnA', type: 'integer' }],
          data: [[null]],
        },
      },
      {
        data: {
          editedStep: { name: 'fillna', column: 'columnA', value: '42' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'columnA', value: 42 }]],
    });
  });

  it('should convert input value to float when the column data type is float', () => {
    const wrapper = runner.mount(
      {
        dataset: {
          headers: [{ name: 'columnA', type: 'float' }],
          data: [[null]],
        },
      },
      {
        data: {
          editedStep: { name: 'fillna', column: 'columnA', value: '42.3' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'columnA', value: 42.3 }]],
    });
  });

  it('should convert input value to boolean when the column data type is boolean', () => {
    const wrapper = runner.mount(
      {
        dataset: {
          headers: [{ name: 'columnA', type: 'boolean' }],
          data: [[null]],
        },
      },
      {
        data: {
          editedStep: { name: 'fillna', column: 'columnA', value: 'true' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    wrapper.setData({ editedStep: { name: 'fillna', column: 'columnA', value: 'false' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [{ name: 'fillna', column: 'columnA', value: true }],
        [{ name: 'fillna', column: 'columnA', value: false }],
      ],
    });
  });

  it('should accept templatable values', () => {
    const wrapper = runner.mount(
      {
        dataset: {
          headers: [{ name: 'foo', type: 'integer' }],
          data: [[null]],
        },
        variables: {
          foo: 'bla',
        },
      },
      {
        data: { editedStep: { name: 'fillna', column: 'foo', value: '<%= foo %>' } },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', column: 'foo', value: '<%= foo %>' }]],
    });
  });

  it('should update step when selectedColumn is changed', async () => {
    const wrapper = runner.shallowMount({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    expect(wrapper.vm.$data.editedStep.column).toEqual('');
    wrapper.vm.$store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.column).toEqual('columnB');
  });

  it('should keep the focus on the column modified after rename validation', async () => {
    const wrapper = runner.mount(
      {
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      },
      {
        propsData: {
          initialStepValue: {
            name: 'fillna',
            column: 'columnA',
            value: '',
          },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['columnA']);
  });
});
