import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Moving average step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['movingaverage'],
    },
    valueColumn: {
      type: 'string',
      minLength: 1,
      title: 'Value column',
      description: 'The value column used in the computation',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    columnToSort: {
      type: 'string',
      minLength: 1,
      title: 'Column to sort',
      description: 'The column to be sorted for the window computation (usually dates)',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    movingWindow: {
      type: 'integer',
      title: 'Moving window',
      description: 'The number of rows used as the moving window of the computation',
      attrs: {
        placeholder: 'Enter an integer',
      },
    },
    groups: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description:
        'The columns used to group the data if needing to apply the computation by group of rows',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    newColumnName: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description:
        'The column to be created for the computation result (by default, the \
          column name suffixed by "_MOVING_AVG")',
      attrs: {
        placeholder: 'Select a column',
      },
    },
  },
  required: ['valueColumn', 'columnToSort', 'movingWindow'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumnName', form.columnNames);
}
