import { FilterEditor, VariableInput, InputText, MultiInputText } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

import Vuex from 'vuex';

const stories = storiesOf('variable', module);

stories.add('Variable input', () => ({
  template: `
    <div style="margin: 30px;">
        <div style="width: 300px;"><VariableInput v-model="value" @removed="value=''"></VariableInput></div>
        <pre style="margin-top: 30px;">{{ value }}</pre>
    </div>
  `,

  store: new Vuex.Store(),

  components: {
    VariableInput
  },

  data() {
    return {
        value: '',
    };
  },
}));

stories.add('MultiInput with variable input', () => ({
  template: `
    <div style="margin: 30px; width:200px;"">
        <MultiInputText v-model="value" :variable="true"></MultiInputText>
        <pre style="margin-top: 30px;">{{ JSON.stringify(value) }}</pre>
    </div>
  `,

  store: new Vuex.Store(),

  components: {
    MultiInputText
  },

  data() {
    return {
        value: []
    };
  },
}));

stories.add('Input with variable input', () => ({
  template: `
    <div style="margin: 30px;  width:200px;"">
        <InputText v-model="value" :variable="true" placeholder="a nice and cool input"></InputText>
        <pre style="margin-top: 30px;">{{ value }}</pre>
    </div>
  `,

  store: new Vuex.Store(),

  components: {
    InputText
  },

  data() {
    return {
        value: ''
    };
  },
}));

// stories.add('Condition editor With variable input', () => ({
//   template: `
//     <div style="margin: 30px;">
//         <FilterEditor :filter-tree="filterTree" @filterTreeUpdated="updateFilterTree"></FilterEditor>
//         <pre style="margin-top: 30px;">{{ filterTreeStringify }}</pre>
//     </div>
//   `,

//   store: new Vuex.Store(),

//   components: {
//     FilterEditor
//   },

//   data() {
//     return {
//       filterTree: { column: '', value: '', operator: 'eq' },
//     };
//   },

//   computed: {
//     filterTreeStringify() {
//       return JSON.stringify(this.filterTree, null, 2);
//     }
//   },

//   methods: {
//     updateFilterTree(newFilterTree) {
//       this.filterTree = newFilterTree;
//     },
//   },
// }));

