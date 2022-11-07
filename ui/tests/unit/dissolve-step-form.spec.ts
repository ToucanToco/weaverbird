import { describe, expect, it, vi } from 'vitest';

import DissolveStepForm from '@/components/stepforms/DissolveStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Dissolve Step Form', () => {
  const runner = new BasicStepFormTestRunner(DissolveStepForm, 'dissolve');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
  });

  describe('MultiselectWidget', () => {
    it('should instantiate an MultiselectWidget widget with proper options from the store', () => {
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

    it('includeNulls should be set properly if defined in inititalStepValue', async () => {
      const wrapper = runner.shallowMount(undefined, {
        propsData: {
          initialStepValue: {
            name: 'dissolve',
            groups: [''],
            aggregations: [],
            includeNulls: true,
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$data.editedStep.includeNulls).toEqual(true);
    });

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'dissolve',
            groups: ['foo', 'bar'],
            aggregations: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });
  });

  describe('ListWidget', () => {
    it('should have exactly on ListWidget component', () => {
      const wrapper = runner.shallowMount();
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should pass down the "aggregations" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'dissolve',
            groups: [],
            aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
            includeNulls: false,
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', newcolumn: 'bar', aggfunction: 'sum' },
      ]);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"on" parameter includes an empty string',
        props: {
          initialStepValue: {
            name: 'dissolve',
            groups: [''],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            includeNulls: false,
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groups.0' }],
      },
      {
        testlabel: '"columns" and "newcolumns" parameters include empty strings',
        props: {
          initialStepValue: {
            name: 'dissolve',
            groups: ['column1'],
            aggregations: [
              {
                newcolumns: [''],
                aggfunction: 'sum',
                columns: [''],
              },
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.aggregations.0.columns.0' },
          { keyword: 'minLength', dataPath: '.aggregations.0.newcolumns.0' },
        ],
      },
      {
        testlabel: '"aggfunction" unknown',
        props: {
          initialStepValue: {
            name: 'dissolve',
            groups: ['column1'],
            aggregations: [
              {
                newcolumns: ['foo_col1'],
                aggfunction: 'foo',
                columns: ['col1'],
              },
            ],
          },
        },
        errors: [{ keyword: 'enum', dataPath: '.aggregations.0.aggfunction' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'dissolve',
          groups: ['foo'],
          aggregations: [{ columns: ['bar'], newcolumns: ['bar'], aggfunction: 'sum' }],
          includeNulls: false,
        },
      },
    });
  });

  it('should keep the same column name as newcolumn if only one aggregation is performed', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'dissolve',
          groups: ['foo'],
          aggregations: [{ columns: ['bar'], newcolumns: [''], aggfunction: 'sum' }],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('bar');
  });

  it('should set newcolumn cleverly if several aggregations are performed on the same column', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'dissolve',
          groups: ['foo'],
          aggregations: [
            { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'sum' },
            { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'avg' },
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('bar-sum');
    expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumns[0]).toEqual('bar-avg');
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[1]).toEqual('test-sum');
    expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumns[1]).toEqual('test-avg');
  });

  it('should set newcolumn cleverly if the an aggregation is perform on an id column', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'dissolve',
          groups: ['foo'],
          aggregations: [{ columns: ['foo'], newcolumns: [''], aggfunction: 'count' }],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('foo-count');
  });

  runner.testCancel();
  runner.testResetSelectedIndex();
});
