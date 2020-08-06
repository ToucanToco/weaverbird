import { FilterStepForm, registerModule } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';
import Vuex from "vuex";

const stories = storiesOf('Step forms/Filter step form', module);

stories.add('FilterStepForm', () => ({
  template: `
    <FilterStepForm />
  `,

  components: {
    FilterStepForm
  },

  store: new Vuex.Store(),

  created() {
    registerModule(this.$store, {
      dataset: {
        headers: [],
        data: [],
      }
    })
  },
}));
