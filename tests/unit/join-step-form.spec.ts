import { shallowMount, createLocalVue } from '@vue/test-utils';
import JoinStepForm from '@/components/stepforms/JoinStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
}

describe('join Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(JoinStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.stepname).toEqual('join');
  });

  describe('ListWidget', () => {
    it('should have exactly 3 input components', () => {
      const wrapper = shallowMount(JoinStepForm, { store: emptyStore, localVue });
      const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
      expect(autocompleteWrappers.length).toEqual(2);
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should instantiate an autocomplete widget with proper options from the store', () => {
      const store = setupMockStore({
        currentPipelineName: 'my_dataset',
        pipelines: {
          my_dataset: [{ name: 'domain', domain: 'my_data' }],
          dataset1: [{ name: 'domain', domain: 'domain1' }],
          dataset2: [{ name: 'domain', domain: 'domain2' }],
        },
      });
      const wrapper = shallowMount(JoinStepForm, { store, localVue });
      const widgetMultiselect = wrapper.find('autocompletewidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('dataset1,dataset2');
    });

    it('should pass down the "joinColumns" prop to the ListWidget value prop', async () => {
      const wrapper = shallowMount(JoinStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'join',
          right_pipeline: 'pipeline_right',
          type: 'left',
          on: [['foo', 'bar']],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
    });

    it('should get the right data "on" when editedStep.on is empty', async () => {
      const wrapper = shallowMount(JoinStepForm, { store: emptyStore, localVue });
      wrapper.setData({
        editedStep: {
          name: 'join',
          right_pipeline: 'pipeline_right',
          type: 'left',
          on: [],
        },
      });
      await localVue.nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([[]]);
    });
  });
});
