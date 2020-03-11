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
      $ref: '#/definitions/advancedCondition',
    },
  },
  definitions: {
    advancedCondition: {
      type: 'object',
      oneOf: [
        {
          properties: {
            and: {
              type: 'array',
              minItems: 1,
              title: 'And condition',
              items: {
                oneOf: [
                  { $ref: '#/definitions/simpleCondition' },
                  { $ref: '#/definitions/advancedCondition' },
                ],
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
              items: {
                oneOf: [
                  { $ref: '#/definitions/simpleCondition' },
                  { $ref: '#/definitions/advancedCondition' },
                ],
              },
            },
          },
          required: ['or'],
          additionalProperties: false,
        },
      ],
    },
    simpleCondition: {
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
          type: ['string', 'number', 'boolean', 'null', 'array'],
          minLength: 1,
          title: 'Value',
          description: 'The value to compare',
          attrs: {
            placeholder: 'Enter a value',
          },
        },
        operator: {
          type: 'string',
          enum: [
            'eq',
            'ne',
            'gt',
            'ge',
            'lt',
            'le',
            'in',
            'nin',
            'matches',
            'notmatches',
            'isnull',
            'notnull',
          ],
          title: 'Operator',
          description: 'The filter operator',
          attrs: {
            placeholder: 'Choose the filter operator',
          },
        },
      },
      required: ['column', 'value', 'operator'],
      additionalProperties: false,
    },
  },
  required: ['name', 'condition'],
  additionalProperties: false,
};
