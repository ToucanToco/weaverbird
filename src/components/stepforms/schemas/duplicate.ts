import { StepFormType, addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Duplicate column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['duplicate'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to duplicate',
      description: 'Column to duplicate',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    new_column_name: {
      type: 'string',
      minLength: 1,
      title: 'New column name for duplicated column',
      description: 'New column name for duplicated column',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
  },
  required: ['name', 'column', 'new_column_name'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'new_column_name', form.columnNames);
}
