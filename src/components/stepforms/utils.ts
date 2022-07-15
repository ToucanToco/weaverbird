import { AggregateStep, DissolveStep } from '@/lib/steps';

export function suffixAggregationsColumns(editedStep: AggregateStep | DissolveStep): void {
  /**
   * If different aggregations have to be performed on the same column, add a suffix
   * to the automatically generated newcolumn name
   */
  const newcolumnOccurences: { [prop: string]: number } = {};
  for (const agg of editedStep.aggregations) {
    agg.newcolumns = [...agg.columns];
    for (const c of agg.newcolumns) {
      newcolumnOccurences[c] = (newcolumnOccurences[c] || 0) + 1;
    }
  }
  for (const agg of editedStep.aggregations) {
    for (let i = 0; i < agg.newcolumns.length; i++) {
      /**
       * If we keep the original granularity, we keep the original value columns
       * and add the aggregation results in new columns, so we need to suffix those
       */
      if (
        newcolumnOccurences[agg.newcolumns[i]] > 1 ||
        (editedStep.name === 'aggregate' && editedStep.keepOriginalGranularity)
      ) {
        agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
      }
      if (
        (editedStep.name === 'aggregate' && editedStep.on.includes(agg.newcolumns[i])) ||
        (editedStep.name === 'dissolve' && editedStep.groups.includes(agg.newcolumns[i]))
      ) {
        agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
      }
    }
  }
}
