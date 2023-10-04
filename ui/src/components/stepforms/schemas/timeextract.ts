export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Extract time property from time step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['timeextract'],
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
    timeInfo: {
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
      title: 'Time information to extract',
      description: 'A list of all the information to extract from the time column',
    },
    newColumns: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      minItems: 1,
      title: 'New column(s) name',
      description: 'The name of the time information column(s) that will be created',
    },
  },
  required: ['name', 'column', 'timeInfo', 'newColumns'],
  additionalProperties: false,
};
