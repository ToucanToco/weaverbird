export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Unpivot step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['unpivot'],
    },
    keep: {
      type: 'array',
      items: {
        type: 'string',
        minlength: 1,
      },
      minItems: 1,
      title: 'Columns to keep fixed',
      description: 'Columns to keep fixed around which to unpivot columns.',
      attrs: {
        placeholder: 'Columns to keep fixed',
      },
    },
    unpivot: {
      type: 'array',
      items: {
        type: 'string',
        minlength: 1,
      },
      minItems: 1,
      title: 'Columns to unpivot',
      description: 'Columns to unpivot.',
      attrs: {
        placeholder: 'Columns to unpivot',
      },
    },
    unpivot_column_name: {
      type: 'string',
      minLength: 1,
      title: 'Name of the new dimension column',
      description: 'Name of the new dimension column',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
    value_column_name: {
      type: 'string',
      minLength: 1,
      title: 'Name of the new value column',
      description: 'Name of the new value column created after unpivot',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
    dropna: {
      type: 'boolean',
      default: true,
      title: 'Drop null values',
      description: 'Whether null values have to be kept or discarded',
    },
  },
  required: ['name', 'keep', 'unpivot', 'unpivot_column_name', 'value_column_name', 'dropna'],
  additionalProperties: false,
};
