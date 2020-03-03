import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Extract date propperty from date step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['dateextract'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to convert',
      description: 'Column to convert',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    operation: {
      type: 'string',
      enum: [
        'year',
        'month',
        'day',
        'hour',
        'minutes',
        'seconds',
        'milliseconds',
        'dayOfYear',
        'dayOfWeek',
        'week',
      ],
      title: 'Operation',
      description: 'The name of the property to extract',
      attrs: {
        placeholder: 'Choose the property to extract',
      },
    },
    newColumn: {
      type: 'string',
      title: 'New column name',
      description: 'The new column that will be created after extraction',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
  },
  required: ['name', 'column', 'operation'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumn', form.columnNames);
}
