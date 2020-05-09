export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rank step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['rank'],
    },
    column: {
      type: 'string',
      title: 'Column to rank',
      description: 'The name of the column you want to rank.',
    },
    rankColumnName: {
      type: 'string',
      title: 'New column name',
      description: 'The new name of the column',
    },
    sortOrder: {
      type: 'string',
      enum: ['asc', 'desc'],
    },
  },
  required: ['name', 'column', 'rankColumnName', 'sortOrder'],
  additionalProperties: false,
};
