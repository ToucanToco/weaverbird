import { VueConstructor } from 'vue';

import StepForm from '@/components/stepforms/StepForm.vue';
import { PipelineStepName } from '@/lib/steps';

import AbsoluteValueStepForm from './AbsoluteValueStepForm.vue';
import AddMissingDatesStepForm from './AddMissingDatesStepForm.vue';
import AddTextColumnStepForm from './AddTextColumnStepForm.vue';
import AddTotalRowsStepForm from './AddTotalRowsStepForm.vue';
import AggregateStepForm from './AggregateStepForm.vue';
import AppendStepForm from './AppendStepForm.vue';
import ArgmaxStepForm from './ArgmaxStepForm.vue';
import ArgminStepForm from './ArgminStepForm.vue';
import CompareTextStepForm from './CompareTextStepForm.vue';
import ComputeDurationStepForm from './ComputeDurationStepForm.vue';
import ConcatenateStepForm from './ConcatenateStepForm.vue';
import ConvertStepForm from './ConvertStepForm.vue';
import CumSumStepForm from './CumSumStepForm.vue';
import CustomSqlStepForm from './CustomSqlStepForm.vue';
import CustomStepForm from './CustomStepForm.vue';
import DateExtractStepForm from './DateExtractStepForm.vue';
import DeleteColumnStepForm from './DeleteColumnStepForm.vue';
import DissolveStepForm from './DissolveStepForm.vue';
import DomainStepForm from './DomainStepForm.vue';
import DuplicateColumnStepForm from './DuplicateColumnStepForm.vue';
import EvolutionStepForm from './EvolutionStepForm.vue';
import FillnaStepForm from './FillnaStepForm.vue';
import FilterStepForm from './FilterStepForm.vue';
import FormulaStepForm from './FormulaStepForm.vue';
import FromDateStepForm from './FromDateStepForm.vue';
import IfThenElseStepForm from './IfThenElseStepForm.vue';
import JoinStepForm from './JoinStepForm.vue';
import MovingAverageStepForm from './MovingAverageStepForm.vue';
import PercentageStepForm from './PercentageStepForm.vue';
import PivotStepForm from './PivotStepForm.vue';
import RankStepForm from './RankStepForm.vue';
import RenameStepForm from './RenameStepForm.vue';
import ReplaceStepForm from './ReplaceStepForm.vue';
import RollupStepForm from './RollupStepForm.vue';
import SelectColumnStepForm from './SelectColumnStepForm.vue';
import SortStepForm from './SortStepForm.vue';
import SplitStepForm from './SplitStepForm.vue';
import StatisticsStepForm from './StatisticsStepForm.vue';
import SubstringStepForm from './SubstringStepForm.vue';
import ToDateStepForm from './ToDateStepForm.vue';
import ToLowerStepForm from './ToLowerStepForm.vue';
import TopStepForm from './TopStepForm.vue';
import ToUpperStepForm from './ToUpperStepForm.vue';
import TrimStepForm from './TrimStepForm.vue';
import UniqueGroupsStepForm from './UniqueGroupsStepForm.vue';
import UnpivotStepForm from './UnpivotStepForm.vue';
import WaterfallStepForm from './WaterfallStepForm.vue';

// Map components with their step name
const StepFormsComponents: { [K in PipelineStepName]: VueConstructor<StepForm> } = {
  absolutevalue: AbsoluteValueStepForm,
  addmissingdates: AddMissingDatesStepForm,
  text: AddTextColumnStepForm,
  totals: AddTotalRowsStepForm,
  aggregate: AggregateStepForm,
  append: AppendStepForm,
  argmin: ArgminStepForm,
  argmax: ArgmaxStepForm,
  comparetext: CompareTextStepForm,
  concatenate: ConcatenateStepForm,
  convert: ConvertStepForm,
  cumsum: CumSumStepForm,
  custom: CustomStepForm,
  customsql: CustomSqlStepForm,
  dateextract: DateExtractStepForm,
  delete: DeleteColumnStepForm,
  dissolve: DissolveStepForm,
  duration: ComputeDurationStepForm,
  duplicate: DuplicateColumnStepForm,
  domain: DomainStepForm,
  evolution: EvolutionStepForm,
  fillna: FillnaStepForm,
  filter: FilterStepForm,
  ifthenelse: IfThenElseStepForm,
  formula: FormulaStepForm,
  fromdate: FromDateStepForm,
  join: JoinStepForm,
  movingaverage: MovingAverageStepForm,
  percentage: PercentageStepForm,
  pivot: PivotStepForm,
  rank: RankStepForm,
  rename: RenameStepForm,
  replace: ReplaceStepForm,
  rollup: RollupStepForm,
  select: SelectColumnStepForm,
  split: SplitStepForm,
  sort: SortStepForm,
  statistics: StatisticsStepForm,
  substring: SubstringStepForm,
  todate: ToDateStepForm,
  lowercase: ToLowerStepForm,
  top: TopStepForm,
  trim: TrimStepForm,
  uppercase: ToUpperStepForm,
  uniquegroups: UniqueGroupsStepForm,
  unpivot: UnpivotStepForm,
  waterfall: WaterfallStepForm,
};

export default StepFormsComponents;
