export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Compute duration step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['duration'],
    },
    newColumnName: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'New column name',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
    startDateColumn: {
      type: 'string',
      minLength: 1,
      title: 'Start date column:',
      description: 'Start column name',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    endDateColumn: {
      type: 'string',
      minLength: 1,
      title: 'End date column:',
      description: 'End column name',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    durationIn: {
      type: 'string',
      title: 'Duration units',
      enum: ['days', 'hours', 'minutes', 'seconds'],
    },
  },
  required: ['name', 'newColumnName', 'startDateColumn', 'endDateColumn', 'durationIn'],
  additionalProperties: false,
};
