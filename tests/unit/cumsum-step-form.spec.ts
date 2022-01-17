import CumSumStepForm from '@/components/stepforms/CumSumStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Cumsum Step Form', () => {
  const runner = new BasicStepFormTestRunner(CumSumStepForm, 'cumsum');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
    'columnpicker-stub': 1,
    'listwidget-stub': 1,
  });

  describe('MultiselectWidgets', () => {
    it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'cumsum',
            valueColumn: 'myValues',
            referenceColumn: 'myDates',
            groupby: ['foo', 'bar'],
          },
        },
      });
      await wrapper.vm.$nextTick();
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.props().value).toEqual(['foo', 'bar']);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"groupby" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'cumsum',
            toCumSum: [['col1', '']],
            referenceColumn: 'myDates',
            groupby: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby[0]' }],
      },
      {
        testlabel: '"toCumSum" parameter is an empty list',
        props: {
          initialStepValue: {
            name: 'cumsum',
            toCumSum: [],
            referenceColumn: 'myDates',
          },
        },
        errors: [{ keyword: 'minItems', dataPath: '.toCumSum' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      }),
      props: {
        initialStepValue: {
          name: 'cumsum',
          toCumSum: [['myValues', 'myNewColumn']],
          referenceColumn: 'myDates',
          groupby: ['foo', 'bar'],
        },
      },
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should convert editedStep from old configurations to new configuration', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: {
            name: 'cumsum',
            valueColumn: 'foo',
            newColumn: 'bar',
            referenceColumn: 'toto',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toCumSum).toBeDefined();
    expect(wrapper.vm.$data.editedStep.toCumSum).toEqual([['foo', 'bar']]);
  });

  it('should pass down "toCumSum" to ListWidget', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'cumsum',
            toCumSum: [['foo', 'bar']],
            referenceColumn: 'toto',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
  });

  it('should update editedStep when ListWidget is updated', async () => {
    const wrapper = runner.shallowMount({});
    await wrapper.vm.$nextTick();
    wrapper.find('listwidget-stub').vm.$emit('input', [['foo', 'bar']]);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toCumSum).toEqual([['foo', 'bar']]);
  });
});
