/*
  This file creates the bundle needed by storybook to import the UI components.
  All components available in the Storybook must be exported here.
*/

import DataViewer from '../src/components/DataViewer.vue';
import FilterStepForm from '../src/components/stepforms/FilterStepForm.vue';
import RenameStepForm from '../src/components/stepforms/RenameStepForm.vue';
import Pipeline from '../src/components/Pipeline.vue';
import ResizablePanels from '../src/components/ResizablePanels.vue';
import Step from '../src/components/Step.vue';
import ConditionsEditor from '../src/components/ConditionsEditor/ConditionsEditor.vue';
import FilterEditor from '../src/components/FilterEditor.vue';
import ListUniqueValues from '../src/components/ListUniqueValues.vue';
import VariableInput from '../src/components/stepforms/widgets/VariableInput.vue';
import InputText from '../src/components/stepforms/widgets/InputText.vue';
import MultiInputText from '../src/components/stepforms/widgets/MultiInputText.vue';
import Multiselect from '../src/components/stepforms/widgets/Multiselect.vue';
import IfThenElseWidget from '../src/components/stepforms/widgets/IfThenElseWidget.vue';
import Autocomplete from '../src/components/stepforms/widgets/Autocomplete.vue';
import List from '../src/components/stepforms/widgets/List.vue';
import InputNumber from '../src/components/stepforms/widgets/InputNumber.vue';
import AddTextColumnStepForm from '../src/components/stepforms/AddTextColumnStepForm.vue';
import FormulaStepForm from '../src/components/stepforms/FormulaStepForm.vue';
import IfThenElseStepForm from '../src/components/stepforms/IfThenElseStepForm.vue';

export {
  FilterEditor,
  ConditionsEditor,
  DataViewer,
  FilterStepForm,
  RenameStepForm,
  Pipeline,
  InputText,
  ResizablePanels,
  Step,
  ListUniqueValues,
  VariableInput,
  MultiInputText,
  IfThenElseWidget,
  Autocomplete,
  List,
  InputNumber,
  Multiselect,
  AddTextColumnStepForm,
  FormulaStepForm,
  IfThenElseStepForm,
};
export { setupStore, registerModule, VQBnamespace } from '../src/store';
