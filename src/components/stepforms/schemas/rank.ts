import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rank step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'rank',
    },
    valueCol: {
      type: 'string',
      minLength: 1,
      title: 'Value column name',
      description: 'The name of the value column to rank',
    },
    order: {
      type: 'string',
      title: 'Sort order',
      enum: ['asc', 'desc'],
    },
    method: {
      type: 'string',
      title: 'Ranking method',
      enum: ['standard', 'dense'],
    },
    groupby: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group rank computation',
    },
    newColumnName: {
      type: 'string',
      minLength: 1,
      title: 'Rank column name',
      description: 'The name of the new column to be created',
    },
  },
  required: ['name', 'valueCol', 'order', 'method'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumnName', form.columnNames);
}
