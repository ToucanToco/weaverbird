import EvolutionStepForm from '@/components/stepforms/EvolutionStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Evolution Step Form', () => {
  const runner = new BasicStepFormTestRunner(EvolutionStepForm, 'evolution');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 2,
    'autocompletewidget-stub': 2,
    'multiselectwidget-stub': 1,
    'inputtextwidget-stub': 1,
  });
  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'evolution',
        dateCol: 'date',
        valueCol: 'value',
        evolutionType: 'vsLastYear',
        evolutionFormat: 'abs',
        indexColumns: [],
      },
    },
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.dateCol' },
        { keyword: 'minLength', dataPath: '.valueCol' },
      ],
    },
    {
      testlabel: 'existing column name',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'foo' }],
          data: [],
        },
      }),
      data: {
        editedStep: {
          name: 'evolution',
          dateCol: 'date',
          valueCol: 'value',
          evolutionType: 'vsLastYear',
          indexColumns: [],
          newColumn: 'foo',
        },
      },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumn' }],
    },
  ]);

  it('should pass down props to widgets', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'evolution',
          dateCol: 'date',
          valueCol: 'value',
          evolutionType: 'vsLastYear',
          evolutionFormat: 'pct',
          indexColumns: ['index'],
          newColumn: 'foo',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.dateColumnInput').props('value')).toEqual('date');
    expect(wrapper.find('.valueColumnInput').props('value')).toEqual('value');
    expect(wrapper.find('.evolutionType').props('value').evolutionType).toEqual('vsLastYear');
    expect(wrapper.find('.evolutionFormat').props('value').evolutionFormat).toEqual('pct');
    expect(wrapper.find('.indexColumnsInput').props('value')).toEqual(['index']);
    expect(wrapper.find('.newColumnInput').props('value')).toEqual('foo');
  });

  it('should pass set evolutionFormat properly', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'evolution',
          dateCol: 'date',
          valueCol: 'value',
          evolutionType: 'vsLastYear',
          evolutionFormat: 'abs',
        },
      },
    });
    await wrapper.vm.$nextTick();
    wrapper
      .find('.evolutionFormat')
      .vm.$emit('input', { evolutionFormat: 'pct', label: 'percentage' });
    expect(wrapper.vm.$data.editedStep.evolutionFormat).toEqual('pct');
  });

  it('should pass set evolutionType properly', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'evolution',
          dateCol: 'date',
          valueCol: 'value',
          evolutionType: 'vsLastYear',
          evolutionFormat: 'abs',
        },
      },
    });
    await wrapper.vm.$nextTick();
    wrapper
      .find('.evolutionType')
      .vm.$emit('input', { evolutionType: 'vsLastMonth', label: 'last month' });
    expect(wrapper.vm.$data.editedStep.evolutionType).toEqual('vsLastMonth');
  });
});
