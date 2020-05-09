import RankStepForm from '@/components/stepforms/RankStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Rank Step Form', () => {
  const runner = new BasicStepFormTestRunner(RankStepForm, 'rank');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'InputTextWidget-stub': 1,
    'AutocompleteWidget-stub': 1,
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
      initialStepValue: { name: 'rank', column: 'foo', rankColumnName: '', sortOrder: 'asc' },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down "column" to ColumnPicker', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'rank',
            column: 'test',
            rankColumnName: 'mika',
            sortOrder: 'desc',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('columnpicker-stub').attributes().value).toEqual('test');
  });

  it('should pass down rank column name to InputTextWidget', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'rank',
            column: 'test',
            rankColumnName: 'mika',
            sortOrder: 'desc',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('InputTextWidget-stub').props().value).toEqual('mika');
  });

  it('should pass down the sort order to AutocompleteWidget', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'rank',
            column: 'test',
            rankColumnName: 'mika',
            sortOrder: 'desc',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('AutocompleteWidget-stub').props().value).toEqual('desc');
  });
});
