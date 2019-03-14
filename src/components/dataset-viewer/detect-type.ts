import _ from 'lodash'

export default function(value: any) {
  if (_.isString(value))
    return 'String'
  if (_.isNaN(value))
    return 'NaN'
  if (_.isNumber(value))
    return 'Number'
  if (_.isBoolean(value))
    return 'Boolean'
  if (_.isUndefined(value))
    return 'Undefined'
  if (_.isNull(value))
    return 'Null'
}
