export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Extract at given granularity from date',
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
    granularity: {
      type: 'string',
      enum: ['year', 'quarter', 'month', 'isoWeek', 'week', 'day'],
      title: 'Date granularity to apply',
      description: 'At what granularity will the date be truncated.',
    },
    newColumn: {
      type: 'string',
      title: 'New column name',
      description:
        'The new column that will be created after extraction. Leave empty to not create a new column.',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
  },
  required: ['name', 'column', 'granularity'],
  additionalProperties: false,
};
