import _ from 'lodash';
import { describe, expect, it, vi } from 'vitest';

import TopStepForm from '@/components/stepforms/TopStepForm.vue';
import type { ScopeContext } from '@/lib/templating';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Top Step Form', () => {
  const runner = new BasicStepFormTestRunner(TopStepForm, 'top');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'columnpicker-stub': 1,
    'autocompletewidget-stub': 1,
    'multiselectwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'type', dataPath: '.limit' },
        { keyword: 'minLength', dataPath: '.rankOn' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'top', rankOn: 'foo', sort: 'asc', limit: 10, groups: ['test'] },
    },
  });

  runner.testCancel();

  it('should pass down default properties to the input components', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: { name: 'top', rankOn: 'foo', limit: 3 },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.limitInput').props('value')).toEqual(3);
    expect(wrapper.find('.sortOrderInput').props('value')).toEqual('desc');
    expect(wrapper.find('.groupbyColumnsInput').props('value')).toEqual([]);
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: { name: 'top', rankOn: 'foo', sort: 'asc', limit: 10, groups: ['test'] },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.limitInput').props('value')).toEqual(10);
    expect(wrapper.find('.sortOrderInput').props('value')).toEqual('asc');
    expect(wrapper.find('.groupbyColumnsInput').props('value')).toEqual(['test']);
  });

  it('should accept templatable values', async () => {
    function interpolate(s: string, context: ScopeContext) {
      const compiled = _.template(s);
      return compiled(context);
    }
    const wrapper = runner.mount({
      propsData: {
        variables: {
          leemeat: 42,
        },
        interpolateFunc: interpolate,
        initialStepValue: {
          name: 'top',
          rankOn: 'foo',
          sort: 'asc',
          limit: '<%= leemeat %>',
          groups: ['test'],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted().formSaved).toEqual([
      [{ name: 'top', rankOn: 'foo', sort: 'asc', limit: '<%= leemeat %>', groups: ['test'] }],
    ]);
  });
});
