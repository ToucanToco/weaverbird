export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Extract at given granularity from date',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['dategranularity'],
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
      minLength: 1,
      oneOf: [
        {
          pattern: '^<%=.+%>$',
        },
        {
          enum: ['year', 'quarter', 'month', 'isoWeek', 'week', 'day'],
        },
      ],
      title: 'Date granularity to apply',
      description:
        "The granularity to which the date will be truncated. Should be one of 'year', 'quarter', 'month', 'isoWeek', 'week' or 'day'.",
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
