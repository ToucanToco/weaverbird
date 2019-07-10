export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Filter step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['filter'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column name',
      description: 'The name of the column you want to filter on.',
      attrs: {
        placeholder: 'Enter the column name',
      },
    },
    value: {
      type: ['string', 'integer', 'boolean', 'null'],
      minLength: 1,
      title: 'Value',
      description: 'The new name of the column',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
    operator: {
      type: 'string',
      enum: ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'nin'],
      title: 'Operator',
      description: 'The filter operator',
      attrs: {
        placeholder: 'Choose the filter operator',
      },
    },
  },
  required: ['name', 'column', 'value', 'operator'],
  additionalProperties: false,
};
