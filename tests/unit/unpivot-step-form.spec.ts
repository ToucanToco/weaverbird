import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import UnpivotStepForm from '@/components/stepforms/UnpivotStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner, RootState } from './utils';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Unpivot Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  const runner = new BasicStepFormTestRunner(UnpivotStepForm, 'unpivot', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 2,
    'checkboxwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'fields are missing',
      errors: [
        { keyword: 'minItems', dataPath: '.keep' },
        { keyword: 'minItems', dataPath: '.unpivot' },
      ],
    },
  ]);

  runner.testValidate(
    {
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'unpivot',
          keep: ['columnA', 'columnB'],
          unpivot: ['columnC'],
          dropna: true,
        },
      },
    },
    {
      name: 'unpivot',
      keep: ['columnA', 'columnB'],
      unpivot: ['columnC'],
      unpivot_column_name: 'variable',
      value_column_name: 'value',
      dropna: true,
    },
  );

  runner.testCancel({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  it('should pass down props to widgets', () => {
    const wrapper = shallowMount(UnpivotStepForm, {
      store: emptyStore,
      localVue,
      data: () => {
        return {
          editedStep: {
            name: 'unpivot',
            keep: ['foo', 'bar'],
            unpivot: ['baz'],
            unpivot_column_name: 'spam',
            value_column_name: 'eggs',
            dropna: false,
          },
        };
      },
    });
    expect(wrapper.find('#keepColumnInput').props('value')).toEqual(['foo', 'bar']);
    expect(wrapper.find('#unpivotColumnInput').props('value')).toEqual(['baz']);
    const widgetCheckbox = wrapper.find(CheckboxWidget);
    expect(widgetCheckbox.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(UnpivotStepForm, { store, localVue });
    expect(wrapper.find('#keepColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
    expect(wrapper.find('#unpivotColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });
});
