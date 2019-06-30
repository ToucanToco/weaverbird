import { StepFormType, addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Percentage step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['percentage'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Value column',
      description: 'The column on which to base the percentage computation',
      attrs: {
        placeholder: 'Add a column',
      },
    },
    group: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description:
        'The columns used to group the data if needing to segment the percentage computation',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    new_column: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'The new column name if computation hase to be written in a new column',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
  },
  required: ['column'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'new_column', form.columnNames);
}
