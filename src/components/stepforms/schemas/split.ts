export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Split step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['split'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Split column...',
      description: 'The column to split',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    delimiter: {
      type: 'string',
      title: 'Delimiter',
      description: 'The delimiter used to split column',
      attrs: {
        placeholder: 'Enter a tet delimiter',
      },
      minLength: 1,
    },
    number_cols_to_keep: {
      type: 'integer',
      title: 'Number of columns to keep',
      description: 'The number of columns to keep after splitting',
      attrs: {
        placeholder: 'Enter an integer',
      },
    },
  },
  required: ['column', 'delimiter', 'number_cols_to_keep'],
  additionalProperties: false,
};
