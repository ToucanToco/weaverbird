import StatisticsStepForm from '@/components/stepforms/StatisticsStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('statistics Step Form', () => {
  const runner = new BasicStepFormTestRunner(StatisticsStepForm, 'statistics');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'MultiselectWidget-stub': 1,
    'ColumnPicker-stub': 1,
    'Checkbox-stub': 5,
  });

  runner.testValidationErrors([
    {
      testlabel: 'column empty',
      errors: [{ keyword: 'minLength', dataPath: '.column' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'statistics',
        column: 'foo',
        groupbyColumns: [],
        statistics: ['min'],
        quantiles: [],
      },
    },
  });

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        {
          name: 'statistics',
          column: 'jjg',
          groupbyColumns: ['plop'],
          statistics: ['average'],
          quantiles: [{ label: 'median', nth: 1, order: 2 }],
        },
      ],
    },
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex();

  it('should pass down the parameters properly to widgets', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'statistics',
            column: 'jjg',
            groupbyColumns: ['plop'],
            statistics: ['average'],
            quantiles: [{ label: 'median', nth: 1, order: 2 }],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('ColumnPicker-stub').props('value')).toEqual('jjg');
    expect(wrapper.find('MultiselectWidget-stub').props('value')).toEqual(['plop']);
    const Checkboxes: any = wrapper.findAll('Checkbox-stub');
    expect(Checkboxes.at(0).props('value')).toEqual(false); // count
    expect(Checkboxes.at(1).props('value')).toEqual(true); // average
    expect(Checkboxes.at(2).props('value')).toEqual(false); // min
    expect(Checkboxes.at(3).props('value')).toEqual(false); // max
    expect(Checkboxes.at(4).props('value')).toEqual(true); // median

    expect(Checkboxes.at(0).props('label')).toEqual('count'); // count
    expect(Checkboxes.at(1).props('label')).toEqual('average'); // average
    expect(Checkboxes.at(2).props('label')).toEqual('min'); // min
    expect(Checkboxes.at(3).props('label')).toEqual('max'); // max
    expect(Checkboxes.at(4).props('label')).toEqual('median'); // median
  });

  it('should open and close section correcly', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'statistics',
            column: 'jjg',
            groupbyColumns: ['plop'],
            statistics: ['average'],
            quantiles: [{ label: 'median', nth: 1, order: 2 }],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    const basicSection: any = wrapper.findAll('.statistic-section-header').at(0);
    const advancedSection: any = wrapper.findAll('.statistic-section-header').at(1);
    const quantileSection: any = wrapper.findAll('.statistic-section-header').at(2);

    // only basic section is open:
    expect(wrapper.findAll('Checkbox-stub').length).toEqual(5);
    expect(wrapper.findAll('InputNumberWidget-stub').length).toEqual(0);
    // close basic section
    await basicSection.trigger('click');
    expect(wrapper.findAll('Checkbox-stub').length).toEqual(0);
    expect(wrapper.findAll('InputNumberWidget-stub').length).toEqual(0);
    // open advanced section
    await advancedSection.trigger('click');
    expect(wrapper.findAll('Checkbox-stub').length).toEqual(8);
    expect(wrapper.findAll('InputNumberWidget-stub').length).toEqual(0);
    // open custom quantiles section
    await quantileSection.trigger('click');
    expect(wrapper.findAll('Checkbox-stub').length).toEqual(8);
    expect(wrapper.findAll('InputNumberWidget-stub').length).toEqual(2);
  });

  it('should toogle quantiles and statistics correlty', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'statistics',
            column: 'jjg',
            groupbyColumns: ['plop'],
            statistics: ['average'],
            quantiles: [{ label: 'median', nth: 1, order: 2 }],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();

    wrapper
      .findAll('Checkbox-stub')
      .at(0)
      .vm.$emit('input', true); // checking count
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.statistics).toEqual(['average', 'count']);
    wrapper
      .findAll('Checkbox-stub')
      .at(1)
      .vm.$emit('input', false); // unchecking average
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.statistics).toEqual(['count']);

    // open advanced section
    const advancedSection: any = wrapper.findAll('.statistic-section-header').at(1);
    await advancedSection.trigger('click');
    wrapper
      .findAll('Checkbox-stub')
      .at(10)
      .vm.$emit('input', true);
    expect(wrapper.vm.$data.editedStep.quantiles).toEqual([
      { label: 'median', nth: 1, order: 2 },
      { label: 'last decile', nth: 9, order: 10 },
    ]);
    wrapper
      .findAll('Checkbox-stub')
      .at(4)
      .vm.$emit('input', true);
    expect(wrapper.vm.$data.editedStep.quantiles).toEqual([
      { label: 'last decile', nth: 9, order: 10 },
    ]);

    const quantileSection: any = wrapper.findAll('.statistic-section-header').at(2);

    // open custom quantile sections
    await quantileSection.trigger('click');
    wrapper
      .findAll('InputNumberWidget-stub')
      .at(0)
      .vm.$emit('input', '2');
    wrapper
      .findAll('InputNumberWidget-stub')
      .at(1)
      .vm.$emit('input', '4');
    await wrapper.find('.custom-quantile-widget-checkbox').trigger('click');
    expect(wrapper.vm.$data.editedStep.quantiles).toEqual([
      { label: 'last decile', nth: 9, order: 10 },
      { label: undefined, nth: 2, order: 4 },
    ]);
  });
});
