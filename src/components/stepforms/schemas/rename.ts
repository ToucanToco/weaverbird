import { StepFormType, addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rename step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['rename'],
    },
    oldname: {
      type: 'string',
      minLength: 1,
      title: 'Current column name',
      description: 'The name of the column you want to modify.',
      attrs: {
        placeholder: 'Enter a column name to replace',
      },
    },
    newname: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'The new name of the column',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
  },
  required: ['name', 'oldname', 'newname'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newname', form.columnNames);
}
