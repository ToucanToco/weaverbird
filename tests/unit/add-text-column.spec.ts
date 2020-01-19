import AddTextColumnStepForm from '@/components/stepforms/AddTextColumnStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Add Text Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(AddTextColumnStepForm, 'text');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 2,
  });

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', new_column: 'foo' } });
    await wrapper.vm.$nextTick();
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(0)
        .props('value'),
    ).toEqual('some text');
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(1)
        .props('value'),
    ).toEqual('foo');
  });

  it('should make the focus on the column added after validation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState);
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', new_column: 'foo' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['foo']);
  });

  it('should not change the column focus if validation fails', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: { name: 'text', text: '', new_column: 'columnB' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['columnA']);
  });

  describe('Warning', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({ editedStep: { text: '', new_column: 'columnA' } });
      await wrapper.vm.$nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if new_column is not an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({ editedStep: { text: '', new_column: 'columnB' } });
      await wrapper.vm.$nextTick();
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toBeNull();
    });
  });
});
