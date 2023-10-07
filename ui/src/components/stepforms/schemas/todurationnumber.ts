export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert number column to duration step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['todurationnumber'],
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
    unit: {
      type: 'string',
      enum: ['days', 'hours', 'minutes', 'seconds', 'milliseconds'],
    },
  },
  required: ['name', 'column', 'unit'],
  additionalProperties: false,
};
