---
title: Designing a new step
permalink: /docs/new-step/
---

# General principles

Designing a new pipeline step generally consists in doing the following changes:

- implement the pipeline / translation logic itself in the `lib` directory
  - define the step interface
  - implement a translation function for all supported backends
  - define a "human readable" label for this step (e.g. "duplicate column 'foo'")
  - define which fields of the step supports interpolation

- implement the UI part
  - implement a form to configure the step
  - make it accessible through top bar widgets and/or columns contextual menus
  - make it accessible through search

- add documentation
  - add UI documentation
  - add technical documentation

- update the changelog

# Implementation details

In the rest of this documentation, we'll implement a dummy `ColumnSumStep` that
would sum two given columns and output the result in a third column. We'll skip
the unit tests but of course, any PR without tests will be dismissed :).

## Implementing a new step logic

### Defining the step interface

Step types are defined in `src/lib/steps.ts` through typescript types. Our
`ColumnSumStep` needs the name of the two input columns and a name for the
output one. This could be implemented as follows:

```typescript
export type ColumnSumStep = {
  name: 'columnsum',
  column1: string;
  column2: string;
  newColumn: string;
}
```

A few things are worth noticing here:

- we will need the TypeScript type in other files so we'll need to `export` it,

- *weaverbird* uses the [discriminated unions
  pattern](https://www.typescriptlang.org/docs/handbook/advanced-types.html#discriminated-unions)
  so the `name` property is mandatory and should be unique amongst step types.
  Furthermore, **it has to be a valid typescript identifier name** since it will
  be used to match some method names later,

- we keep the type definitions alphabetically sorted in the `steps.ts` module.

We'll also need to extend the `PipelineStep` union type whose role is to encompass
all possible step types:

```typescript

export type PipelineStep =
  | AddTextColumnStep
  // […]
  | ArgminStep
  | ColumnSumStep // <- add our new step definition here
  | ConcatenateStep
  // […]
```

### Implementing a translation function for all supported backends

At this point, the typescript should be invalid since *weaverbird* provides a
few base classes that **must** provide implementation methods for each step type
defined in the `PipelineStep` union type. For reference, the `StepMatcher` type
in the `src/lib/matchers.ts` module is the one in charge to enforce this from a
type system point of view. Since we've just added a new `ColumnSumStep` to the
`PipelineStep` union type, all classes implementing the `StepMatcher` type
won't be valid anymore.

The first things we'll be implementing at this point are backend translation
methods, that is methods responsible for translating a step with the
`ColumnSumType` into valid instructions for the supported output backends (e.g.
`mongo3.6`).

Each backend translation class extends the `BaseTranslator` class in the
`src/lib/translators/base.ts` module. This base class is a kind of abstract
base class for all backend translator classes. The default is to declare our
new step as "unsupported" so that only backends that actually do support the
step will need to provide a translation implementation.

We therefore start by adding the following code in the `BaseTranslator` class
(we'll try to keep things alphabetically sorted here too):

```typescript
export class BaseTranslator implements StepMatcher<OutputStep> {

  // […]
  @unsupported
  columnsum(step: Readonly<S.ColumnSumStep>) {}
  // […]
}
```

The name of the method **must** be the same as the step name.

Then, we'll add an implementation for each supported backend, here mongo only.
In `src/translators/mongo.ts`, we'll add something like:

```typescript
export class Mongo36Translator extends BaseTranslator {
  // […]
  columnsum(step:  Readonly<S.ColumnSumStep>): MongoStep[] {
    return {
      $addFields:{
        [step.newcolumn]: {
          $sum: [ $$(step.column1), $$(step.column2) ]
        }
      }
    };
  }
```

Note: since the `Mongo40Translator` class extends the `Mongo36Translator` one,
it will support our new step for free.

### Defining a human readable label for your step

A labeller is the logical component that provide human readable label for a
given step (e.g. `{ name: "duplicate", column: "foo", new_column_name: "bar" }`
will be labelled `Duplicate "foo" in "bar"`). The graphical representation of
the pipeline will use it to make the transformation easier to understand.

As we did for the translator, we have to provide an implementation for our new
step in the `StepLabeller` class of the `src/lib/labeller.ts` module.

```typescript
class StepLabeller implements StepMatcher<string> {
  // […]
  columnsum(step:  Readonly<S.ColumnSumStep>): MongoStep[] {
    return `Sum columns "${step.column1}" and "${step.column2}" into "${step.newColumn}"`;
  }
  // […]
```


### Implementing interpolation

Again, this boils down to implementing a specific method, this time in the
`PipelineInterpolator` class of the `src/lib/templating.ts` module.

```typescript
class StepLabeller implements StepMatcher<string> {
  // […]
  columnsum(step:  Readonly<S.ColumnSumStep>): MongoStep[] {
    return { ...step };
  }
  // […]
```

If no interpolation is supported, you just have to return a copy of the input
step. Otherwise, you'll need to handle it, most probably by calling the
`_interpolate` helper. You can take the `aggregate` step as an example.

## Implementing a new step form


### Define the JSONSchema for your new step

We use [JSONSchema](https://json-schema.org/) and the [ajv
library](https://github.com/epoberezkin/ajv) to validate the user input for the
step.

Our JSONSchema files are defined as TypeScript modules in the
`src/components/stepforms/schemas` and export a default json schema definition.
For our `ColumnSumStep`, we will create the following
`src/components/stepforms/schemas/columnsum.ts` module:

```typescript
import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Sum columns step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['columnsum'],
    },
    column1: {
      type: 'string',
      minLength: 1,
      title: 'Column1',
      description: 'First input column',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    column2: {
      type: 'string',
      minLength: 1,
      title: 'Column2',
      description: 'Second input column',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    newColumn: {
      type: 'string',
      minLength: 1,
      title: 'Output column name',
      description: 'Output column name'
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
  },
  required: ['name', 'column1', 'column2', 'newColumn'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumn', form.columnNames);
}
```

If you know JSONSchema, things should be pretty straightforward and easy to
understand.  If not, it should still not be hard to grasp most of the concepts:
for each step property, including `name`, we define the field type, some
metadata such as title and description as well as some constraints that should
be checked on form submission and will ensure that data is correct. When a
submitted step is not valid, the `ajv` library outputs errors that are
automatically reported in the UI.

The only real specific constraint here comes from the usage of
`addNotInColumNamesConstraint` which is a helper that takes an input schema, a
column name and the existing column names.  This helper ensures that this
column name doesn't exist yet in order to avoid overriding and existing column.
This is a check that you'll surely want to perform on any new column that your
step will create (i.e. `newColumn` in our specific case).

To register this new schema, you'll need to update the
`src/components/stepforms/schemas/index.ts` module:

```typescript
// […]
import argminSchema from './argmin';
import columnsumSchema from './columnsum';
import concatenateBuildSchema from './concatenate';
// […]


const factories: { [stepname: string]: buildSchemaType } = {
  // […]
  argmin: argminSchema,
  columnsum: columnsumSchema,
  concatenate: concatenateBuildSchema,
  // […]
```

The property name in the `factories` object **must** match exactly the step's name.

### Implementing the form

Chances are that you'll want to reuse the standard step form layout (i.e. with
a title, an `ok` and `back` button, etc.). To do that, you can leverage a few
components and base classes provided:

- `@/components/stepforms/StepFormHeader.vue` is the component that generates a
  standard step form header bar. It should be fed with a `title` and `stepName`
  prop. Furthermore, you can edit the back button behaviour with the
  `cancelEdition` method of your component. The default is in the `StepForm`
  base class.

  ![StepFormHeader](/img/StepFormHeader.png)

  Example:

  ```typescript
  <StepFormHeader :stepName="Filter Step" :title="title" />
  ```

- `@/components/stepforms/StepFormButtonBar.vue` is the component that
  generates a standard step form button bar (_submit_ / _errors_). You can edit
  the submit button behavior with the `submit` method of your component. The
  default is in the base class `StepForm`.

  ![StepFormButtonbar](/img/StepFormButtonbar.png)

  Example:

  ```typescript
  <StepFormButtonbar />
  ```

Between those two elements should lie the list on inputs (_text inputs_,
_autocomplete_. etc.) that your form wil need.

In most cases, you'll want to use the `StepForm` component that is defined in
`@/components/stepforms/StepForm.vue`. This component will provide default
wiring for the most common logic (e.g. form validation).

Here could be a step form implementation:

```typescript
import { Prop } from 'vue-property-decorator';

import Component from 'vue-class-component';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnSumStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'columnsum-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ColumnSumForm extends BaseStepForm<ColumnSumStep> {
   stepname: PipelineStepName = 'columnsum';

  @Prop({ type: Object, default: () => ({ name: 'columnsum', column1: '', column2: '', newColumn: '' }) })
  initialStepValue!: ColumnSumStep;

  readonly title: string = 'Sum columns';
}
```

Most of the code above is just a boilerplate with lots of imports but here are
the few important things you should pay attention to:

- you should extend `BaseStepForm` that provides some standard basic behaviour
  such as form validation. It is a parametrized type that should be
  parametrized with your step type.

- the `stepname` attribute should be filled with your step type.

- the `initialStepValue` data property should be typed with your step type.

The *template* part of your Vue component is pretty much up to you but you'll
probably use a few existing widgets and facilities such as `ColumnPicker`.

Here is a possible template for your step:

```html
<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="column1Input"
      v-model="editedStep.column1"
      name="First column..."
      placeholder="Enter a column"
      data-path=".column1"
      :errors="errors"
    />
    <ColumnPicker
      class="column2Input"
      v-model="editedStep.column2"
      name="Secpmd column..."
      placeholder="Enter a column"
      data-path=".column2"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column name:"
      placeholder="Enter a column name"
      data-path=".newColumn"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>
```

Again, this is pretty straightforward. We use our step fields as `v-model` for our
form inputs. Please make sure to use the `data-path` property on your inputs to
specify which step property the input is associated to. This will allow errors
returned by `ajv` to be associated to the corresponding input in the UI.

### Associate the form with its step name

In `src/components/stepforms/index.ts`, import your component and associate it with its step name.
This way, the `QueryBuilder` component will be able to display your step form when someone creates or edit such a step.

```typescript
import ColumnSumStepForm from './ColumnSumStepForm.vue';

const StepFormsComponents = {
    //...
    columnsum: ColumnSumStepForm,
    //...
}
```

### Make it available through the UI

To create this new step, users should be able to open the form you just implemented
from the UI. Steps creation is possible either from the buttons on top of the data
table (action bar), either from the contextual menus of each column of the table.
The step should also be found in the search bar.

#### In the action bar

Actions are defined in `src/components/constants.ts`.
Add to `ACTION_CATEGORIES` an object with the `name` of your new step and its
action `label` into the adequate category.

### In columns contextual menus

If your step is directly related to one column, it's a good idea to access it through
its contextual menu. To achieve this, add your action directly in the template of
`src/components/ActionMenu.vue`:
```vue
<template>
  <popover :active="isActive" :align="alignLeft" bottom>
    <div class="action-menu__body">
      <div class="action-menu__section">
        ...
        <div class="action-menu__option" @click="createStep('step-name')">Action label</div>
        ...
      </div>
    </div>
  </popover>
</template>
```

#### In the search bar

Searchable actions are defined in the `SEARCH_ACTION` constant in `src/components/constants.ts`.
All actions from `ACTION_CATEGORIES` are imported. You should add in `type: 'Others actions'`
any action not defined in `ACTION_CATEGORIES`, such as contextual ones.

## Adding documentation

You're almost done! Your step is defined, translates to some backends, is
editable, tested. You should just add some documentation before submitting
your pull request. Look out how other step documentation is written and copy it
for you custom step:

- explain to the end user how it should be used in
  `docs/_docs/user-interface/columnsum.md`
  (don't forget to take some screenshots and use them in your documentation),

- add an entry in the `docs/_data/docs.yml` for your step.

