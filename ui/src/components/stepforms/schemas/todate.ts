export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert text column to date step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['todate'],
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
    format: {
      type: 'string',
      minLength: 1,
      title: 'Date format',
    },
  },
  required: ['name', 'column'],
  additionalProperties: false,
};
