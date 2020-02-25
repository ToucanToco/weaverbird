import { addNotInColumnNamesConstraint, StepFormType } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Evolution step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      consnt: 'evolution',
    },
    dateCol: {
      type: 'string',
      minLength: 1,
      title: 'Date column',
      description: 'Date column used to compute evolution',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    valueCol: {
      type: 'string',
      minLength: 1,
      title: 'Value column',
      description: 'The value column',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    evolutionType: {
      type: 'string',
      title: 'Compute evolution versus',
      enum: ['vsLastYear', 'vsLastMonth', 'vsLastWeek', 'vsLastDay'],
    },
    evolutionFormat: {
      type: 'string',
      title: 'Compute evolution in',
      enum: ['abs', 'pct'],
    },
    indexColumns: {
      type: 'array',
      minItems: 0,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'indexColumns',
      description: 'Index columns',
      attrs: {
        placeholder: 'Select columns',
      },
    },
    newColumn: {
      type: 'string',
      minLength: 1,
      title: 'New evolution column',
      description: 'New column to be created',
    },
  },
  required: ['name', 'dateCol', 'valueCol', 'evolutionType', 'evolutionFormat', 'indexColumns'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'newColumn', form.columnNames);
}
