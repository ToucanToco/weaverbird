export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Add Missing Dates step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      consnt: 'addmissingdates',
    },
    datesColumn: {
      type: 'string',
      minLength: 1,
      title: 'Dates column',
      description: 'Dates column to add missing dates in',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    datesGranularity: {
      type: 'string',
      title: 'Dates granularity',
      enum: ['day', 'month', 'year'],
    },
    groups: {
      type: 'array',
      minItems: 0,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'Columns used for group by logic if needed',
      attrs: {
        placeholder: 'Select columns',
      },
    },
  },
  required: ['name', 'datesColumn', 'datesGranularity'],
  additionalProperties: false,
};
