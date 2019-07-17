import { StepFormType, addNotInColumnNamesConstraint } from './utils';

const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Replace step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['replace'],
    },
    search_column: {
      type: 'string',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Search',
      description: 'Columns in which to search values to replace',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    new_column: {
      type: 'string',
      items: {
        type: 'string',
        minLength: 0,
      },
      title: 'Search',
      description: 'Columns in which to search values to replace',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    to_replace: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: ['string', 'number', 'boolean'],
          minItems: 2,
          maxItems: 2,
        },
        minItems: 1,
      },
      minItems: 1,
      title: 'To replace',
      description: 'Values to replace',
    },
  },
  required: ['name', 'search_column', 'to_replace'],
  additionalProperties: false,
};

export default function buildSchema(form: StepFormType) {
  return addNotInColumnNamesConstraint(schema, 'new_column', form.columnNames);
}
