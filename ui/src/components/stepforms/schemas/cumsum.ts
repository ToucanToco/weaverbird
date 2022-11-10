export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Cumulated sum step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'cumsum',
    },
    valueColumn: {
      // Supported for retrocompatibility only
      type: 'string',
      minLength: 1,
      title: 'Value column name',
      description: 'The name of the value column to sum',
    },
    toCumSum: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 0, // The new column name is optional
        },
        minItems: 2,
        maxItems: 2,
      },
      minItems: 1,
      title: 'To Cumulate',
      description:
        'A list of 2-values list, the first one being the column name to cumsum,\
        the second one being the new column name',
    },
    referenceColumn: {
      type: 'string',
      minLength: 1,
      title: 'Reference column name',
      description: 'The name of the reference column that will be sorted (usually dates)',
    },
    groupby: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group cumsum computation',
    },
    newColumn: {
      // Supported for retrocompatibility only
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'The name of the new column to be created',
    },
  },
  required: ['name', 'toCumSum', 'referenceColumn'],
  additionalProperties: false,
};
