# Writing your own Step form

Chances are that you'll want to reuse the standard step form layout
(i.e. with a title, an `ok` and `cancel` button, etc.). To do that,
you can leverage a few components and base classes provided:

- `@/components/stepforms/StepFormTitle.vue` is the component that
  generates a standard step form title bar. It should be fed with a
  `title` props, e.g.:

  ```typescript
  <step-form-title :title="title"></step-form-title>
  ```

- `@/components/stepforms/StepFormButtonBar.vue` is the component that
  generates a standard step form button bar (_ok_ / _cancel_). It should be fed with
  three properties:

  - `errors` the list of errors that should be displayed,
  - `cancel` the callback that will be called when the _cancel_ button is clicked,
  - `submit` the callback that will be called when the _submit_ button is clicked.

  e.g.:

  ```typescript
  <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  ```

Between those two elements should lie the list on inputs (_text inputs_, _autocomplete_. etc.) that your form wil need.

In most cases, you'll want to use the `StepForm` component that is defined in `@/components/stepforms/StepForm.vue`. This component will provide default wiring for the most common
logic (e.g. form validation).

Here's a basic step form component:

```typescript
import { Prop } from 'vue-property-decorator';
import fillnaSchema from '@/assets/schemas/fillna-step__schema.json';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import { StepFormComponent } from '@/components/formlib';
import BaseStepForm from './StepForm.vue';
import { FillnaStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'fillna',
  name: 'fillna-step-form',
  components: {
    BaseStepForm,
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class FillnaStepForm extends BaseStepForm<FillnaStep> {
  @Prop({ type: Object, default: () => ({ name: 'fillna', column: '', value: '' }) })
  initialStepValue!: FillnaStep;

  // custom step form title
  readonly title: string = 'Fill Null Values Step';
  // initialize corresponding json schema
  editedStepModel = fillnaSchema;

  // custom `stepSelectedColumn` property that maps selected column
  // to the `column` field of the step.
  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on fillna "column" field');
    }
    if (colname !== null) {
      this.editedStep.column = colname;
    }
  }
}
```
