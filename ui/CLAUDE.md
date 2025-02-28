# WEAVERBIRD UI DEVELOPMENT GUIDE

## Build & Test Commands
- Build: `yarn build`
- Lint: `eslint`
- Format check: `yarn format:ci`
- Format fix: `yarn format:fix`
- Run tests: `yarn test`
- Run tests with coverage: `yarn coverage`
- Run single test: `yarn test -t "test name pattern"`

## Code Style Guidelines
- **Formatting**: 100 char line length, single quotes, 2 spaces indent
- **Imports**: Use simple-import-sort, require newlines after imports
- **TypeScript**: 
  - Types encouraged but not always required for function returns
  - Prefer `const` over `let` when possible
  - Prefix unused vars with underscore
- **Vue Components**: 
  - Self-closing tags required
  - Return statement required in computed properties
  - Use Options API with `defineComponent` for better TypeScript support
  - Use `PropType` for complex type definitions in props
- **Naming**: Use camelCase for variables/properties, PascalCase for components
- **Console**: No console.log in production code (only warn/error permitted)

## Converting Class Components to Options API Guide

When converting a class component to the Options API:

1. Replace imports:
   ```typescript
   // Old
   import Vue from 'vue';
   import { Component, Prop, Watch, Emit } from 'vue-property-decorator';
   
   // New
   import { defineComponent, PropType } from 'vue';
   ```

2. Convert the component definition:
   ```typescript
   // Old
   @Component({
     name: 'component-name',
     components: { ChildComponent }
   })
   export default class ComponentName extends Vue {
     // class properties and methods
   }
   
   // New
   export default defineComponent({
     name: 'component-name',
     
     components: { 
       ChildComponent 
     },
     
     // add options API sections...
   });
   ```

3. Convert class properties:
   ```typescript
   // Old
   @Prop({ default: false })
   isVisible!: boolean;
   
   someData: string = 'initial value';
   
   // New
   props: {
     isVisible: {
       type: Boolean,
       default: false
     }
   },
   
   data() {
     return {
       someData: 'initial value'
     };
   }
   ```

4. Convert class methods to methods object:
   ```typescript
   // Old
   handleClick() {
     this.someData = 'clicked';
   }
   
   // New
   methods: {
     handleClick() {
       this.someData = 'clicked';
     }
   }
   ```

5. Convert computed properties:
   ```typescript
   // Old
   get computedValue() {
     return this.someData.toUpperCase();
   }
   
   // New
   computed: {
     computedValue() {
       return this.someData.toUpperCase();
     }
   }
   ```

6. Convert watchers:
   ```typescript
   // Old
   @Watch('someData')
   onSomeDataChanged(newVal: string, oldVal: string) {
     console.log(newVal, oldVal);
   }
   
   // New
   watch: {
     someData: {
       handler(newVal, oldVal) {
         console.log(newVal, oldVal);
       }
     }
   }
   ```

7. Convert lifecycle hooks:
   ```typescript
   // Old
   created() {
     this.initialize();
   }
   
   // New (same syntax)
   created() {
     this.initialize();
   }
   ```

8. Convert emitters:
   ```typescript
   // Old
   @Emit('update')
   updateValue(val: string) {
     return val;
   }
   
   // New
   methods: {
     updateValue(val: string) {
       this.$emit('update', val);
     }
   }
   ```

## Migration Plan from Class Components to Options API

### Phase 1: Setup & Preparation
1. **Temporarily re-add dependencies**:
   ```bash
   yarn add vue-class-component vue-property-decorator --dev
   ```
   
2. **Create a list of components to convert**:
   ```bash
   grep -r "vue-property-decorator" --include="*.vue" src/
   grep -r "@Component" --include="*.vue" src/
   grep -r "extends Vue" --include="*.vue" src/
   ```

3. **Set up CLAUDE.md guide** (this document) with conversion instructions

### Phase 2: Implementation
1. **Convert Mock Components First**:
   - `src/components/__mocks__/FAIcon.vue`
   - `src/components/DatePicker/__mocks__/Calendar.vue`
   - Other mock components in test directories

2. **Convert Variable Input Components**:
   - `src/components/stepforms/widgets/VariableInputs/VariableChooser.vue`
   - `src/components/stepforms/widgets/VariableInputs/VariableList.vue`
   - `src/components/stepforms/widgets/VariableInputs/VariableListOption.vue`
   - `src/components/stepforms/widgets/VariableInputs/VariableTag.vue`
   - `src/components/stepforms/widgets/VariableInputs/AdvancedVariableModal.vue`

3. **Convert Base Components**:
   - `src/components/FAIcon.vue`
   - `src/components/Popover.vue`
   - `src/components/Tabs.vue`
   - `src/components/Pagination.vue`
   - `src/components/ListUniqueValues.vue`
   - Other common/shared components

4. **Convert Form Components**:
   - `src/components/stepforms/StepFormHeader.vue`
   - `src/components/stepforms/StoreStepFormComponent.vue`
   - `src/components/stepforms/ColumnPicker.vue`
   - Form widgets and editors

5. **Convert Complex Components**:
   - `src/components/Pipeline.vue`
   - `src/components/QueryBuilder.vue`
   - `src/components/DataViewer.vue`
   - Date pickers and specialized widgets

### Phase 3: Cleanup & Finalization
1. **Run all tests** to ensure everything works correctly:
   ```bash
   yarn test
   ```

2. **Remove the dependencies**:
   ```bash
   yarn remove vue-class-component vue-property-decorator
   ```

3. **Update documentation** to reflect the new coding style

This project is a Visual Query Builder written in Vue/TypeScript. Keep the interface intuitive and accessible for non-technical users who need to transform data.
