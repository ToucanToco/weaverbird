import ComputeDurationStepForm from '@/components/stepforms/ComputeDurationStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Compute Duration Step Form', () => {
  const runner = new BasicStepFormTestRunner(ComputeDurationStepForm, 'duration');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 2,
    'autocompletewidget-stub': 1,
    'inputtextwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.endDateColumn' },
        { keyword: 'minLength', dataPath: '.newColumnName' },
        { keyword: 'minLength', dataPath: '.startDateColumn' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'duration',
        newColumnName: 'test',
        startDateColumn: 'start',
        endDateColumn: 'end',
        durationIn: 'days',
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({
      editedStep: {
        name: 'duration',
        newColumnName: 'test',
        startDateColumn: 'start',
        endDateColumn: 'end',
        durationIn: 'days',
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnNameInput').props('value')).toEqual('test');
    expect(wrapper.find('.startDateColumnInput').props('value')).toEqual('start');
    expect(wrapper.find('.endDateColumnInput').props('value')).toEqual('end');
    expect(wrapper.find('.durationInInput').props('value')).toEqual('days');
  });

  it('should make the focus on the column added after validation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'start' }, { name: 'end' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState);
    wrapper.setData({
      editedStep: {
        name: 'duration',
        newColumnName: 'test',
        startDateColumn: 'start',
        endDateColumn: 'end',
        durationIn: 'days',
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['test']);
  });

  it('should not change the column focus if validation fails', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'start' }, { name: 'end' }],
        data: [],
      },
      selectedColumns: ['start'],
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'duration',
          newColumnName: '',
          startDateColumn: '',
          endDateColumn: '',
          durationIn: 'days',
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['start']);
  });

  describe('Warning', () => {
    it('should report a warning when newColumnName is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'foo' }, { name: 'strat' }, { name: 'end' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'duration',
          newColumnName: 'foo',
          startDateColumn: 'start',
          endDateColumn: 'end',
          durationIn: 'days',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnNameInput').props().warning).toEqual(
        'A column name "foo" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if newColumnName is not an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'foo' }, { name: 'strat' }, { name: 'end' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'duration',
          newColumnName: 'bar',
          startDateColumn: 'start',
          endDateColumn: 'end',
          durationIn: 'days',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnNameInput').props().warning).toBeNull();
    });
  });
});
