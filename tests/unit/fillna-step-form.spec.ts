import FillnaStepForm from '@/components/stepforms/FillnaStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Fillna Step Form', () => {
  const runner = new BasicStepFormTestRunner(FillnaStepForm, 'fillna');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'multiselectwidget-stub': 1,
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
        editedStep: { name: 'fillna', columns: ['columnA'], value: { foo: 'bar' } },
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
      initialStepValue: { name: 'fillna', columns: ['foo', 'toto'], value: 'bar' },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should update editedStep at creation depending on the selected column', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
      selectedColumns: ['toto'],
    };
    const wrapper = runner.shallowMount(initialState, {
      propsData: {
        initialStepValue: {
          name: 'fillna',
          columns: [''],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.columns).toEqual(['toto']);
  });

  it('should return an error if trying to set a null column', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
      selectedColumns: [null],
    };
    try {
      const wrapper = runner.shallowMount(initialState, {
        propsData: {
          initialStepValue: {
            name: 'fillna',
            columns: [''],
          },
        },
      });
      await wrapper.vm.$nextTick();
    } catch (error) {
      expect(error.message).toBe('should not try to set null on fillna "column" field');
    }
  });

  it('should convert editedStep from old configurations to new configuration', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: {
            name: 'fillna',
            column: 'hello',
            value: 0,
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.column).toBeUndefined;
    expect(wrapper.vm.$data.editedStep.columns).toBeDefined;
    expect(wrapper.vm.$data.editedStep.columns).toEqual(['hello']);
  });

  it('should pass down the value prop to widget multiselect', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { columns: ['foo'], value: '' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['foo']);
  });

  it('should pass down the value prop to widget value prop', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { columns: [''], value: 'foo' } });
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
          editedStep: { name: 'fillna', columns: ['columnA'], value: '42' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', columns: ['columnA'], value: 42 }]],
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
          editedStep: { name: 'fillna', columns: ['columnA'], value: '42.3' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', columns: ['columnA'], value: 42.3 }]],
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
          editedStep: { name: 'fillna', columns: ['columnA'], value: 'true' },
        },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    wrapper.setData({ editedStep: { name: 'fillna', columns: ['columnA'], value: 'false' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [{ name: 'fillna', columns: ['columnA'], value: true }],
        [{ name: 'fillna', columns: ['columnA'], value: false }],
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
        data: { editedStep: { name: 'fillna', columns: ['foo'], value: '<%= foo %>' } },
      },
    );
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [[{ name: 'fillna', columns: ['foo'], value: '<%= foo %>' }]],
    });
  });
});
