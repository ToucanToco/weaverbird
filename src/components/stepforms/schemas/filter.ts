const singleValueConditionSchema = {
  type: ['string', 'integer', 'boolean', 'null'],
  minLength: 1,
  title: 'Value',
  description: 'The value to compare',
  attrs: {
    placeholder: 'Enter a value',
  },
};

const multipleValueConditionSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: ['string', 'integer', 'boolean', 'null'],
  },
  title: 'Value',
  description: 'The value(s) to compare',
  attrs: {
    placeholder: 'Enter a value',
  },
};

const simpleConditionSchema = {
  type: 'object',
  properties: {
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
      oneOf: [singleValueConditionSchema, multipleValueConditionSchema],
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
  required: ['column', 'value', 'operator'],
  additionalProperties: false,
};

const complexConditionSchema = {
  id: 'complexCondition',
  type: 'object',
  oneOf: [
    {
      properties: {
        and: {
          type: 'array',
          minItems: 1,
          title: 'And condition',
          description: 'A condition "and" as a list of children conditions',
          items: {
            type: 'object',
            anyOf: [simpleConditionSchema, { $ref: 'complexCondition' }],
          },
        },
      },
      required: ['and'],
      additionalProperties: false,
    },
    {
      properties: {
        or: {
          type: 'array',
          minItems: 1,
          title: 'Or condition',
          description: 'A condition "or" as a list of children conditions',
          items: {
            type: 'object',
            anyOf: [simpleConditionSchema, { $ref: 'complexCondition' }],
          },
        },
      },
      required: ['or'],
      additionalProperties: false,
    },
  ],
};

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Filter schema',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['filter'],
    },
    condition: {
      type: 'object',
      oneOf: [simpleConditionSchema, complexConditionSchema],
    },
  },
  required: ['name', 'condition'],
  additionalProperties: false,
};
