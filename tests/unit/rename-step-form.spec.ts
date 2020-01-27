import RenameStepForm from '@/components/stepforms/RenameStepForm.vue';
import { VQBnamespace } from '@/store';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Rename Step Form', () => {
  const runner = new BasicStepFormTestRunner(RenameStepForm, 'rename');
  runner.testInstantiate();
  runner.testExpectedComponents({ 'inputtextwidget-stub': 1, 'columnpicker-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'oldname or newname is empty',
      errors: [
        { keyword: 'minLength', dataPath: '.newname' },
        { keyword: 'minLength', dataPath: '.oldname' },
      ],
    },
    {
      testlabel: 'newname is an already existing column name',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      }),
      data: { editedStep: { name: 'rename', oldname: 'columnA', newname: 'columnB' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newname' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'rename', oldname: 'foo', newname: 'bar' },
    },
  });

  runner.testCancel({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  runner.testResetSelectedIndex();

  it('should pass down the newname prop to widget value prop', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: { editedStep: { name: 'rename', oldname: '', newname: 'foo' } },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('inputtextwidget-stub').props('value')).toEqual('foo');
  });

  it('should update step when selectedColumn is changed', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.vm.$data.editedStep.oldname).toEqual('');
    wrapper.vm.$store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.oldname).toEqual('columnB');
  });

  it('should reset selectedStepIndex correctly on cancel depending on isStepCreation', () => {
    const initialState = {
      pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
        { name: 'rename', oldname: 'tic', newname: 'tac' },
      ],
      selectedStepIndex: 2,
    };
    const wrapper = runner.mount(initialState, { propsData: { isStepCreation: true } });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedStepIndex).toEqual(2);
    wrapper.setProps({ isStepCreation: false });
    wrapper.find('.step-edit-form__back-button').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedStepIndex).toEqual(3);
  });

  it('should make the focus on the column modified after rename validation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState, {
      data: { editedStep: { name: 'rename', oldname: 'columnA', newname: 'toto' } },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['toto']);
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
      data: { editedStep: { name: 'rename', oldname: 'columnA', newname: 'columnB' } },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['columnA']);
  });
});
