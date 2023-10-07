export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Extract duration property from duration step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['durationextract'],
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
    durationInfo: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'days',
          'hours',
          'minutes',
          'seconds',
          'milliseconds',
          'total_days',
          'total_hours',
          'total_minutes',
          'total_seconds',
          'total_milliseconds',
        ],
      },
      minItems: 1,
      title: 'Duration information to extract',
      description: 'A list of all the information to extract from the duration column',
    },
    newColumns: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      minItems: 1,
      title: 'New column(s) name',
      description: 'The name of the duration information column(s) that will be created',
    },
  },
  required: ['name', 'column', 'durationInfo', 'newColumns'],
  additionalProperties: false,
};
