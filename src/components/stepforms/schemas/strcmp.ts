export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Compare strings step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['strcmp'],
    },
    newColumnName: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'New column name',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
    strCol1: {
      type: 'string',
      minLength: 1,
      title: 'First text column to compare:',
      description: 'First text column name to compare',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    strCol2: {
      type: 'string',
      minLength: 1,
      title: 'Second text column to compare:',
      description: 'Second text column name to compare',
      attrs: {
        placeholder: 'Select a column',
      },
    },
  },
  required: ['name', 'newColumnName', 'strCol1', 'strCol2'],
  additionalProperties: false,
};
