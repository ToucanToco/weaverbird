<script lang="ts">
import type { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import _ from 'lodash';
import { defineComponent, PropType } from 'vue';

import schemaFactory from '@/components/stepforms/schemas';
import { addAjvKeywords, ajvErrorsToValidationError } from '@/components/stepforms/schemas/utils';
import StepFormButtonbar from '@/components/stepforms/StepFormButtonbar.vue';
import StepFormHeader from '@/components/stepforms/StepFormHeader.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import type { PipelineStep, ReferenceToExternalQuery } from '@/lib/steps';
import type { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { PipelineInterpolator } from '@/lib/templating';
import type { ValidationError } from '@/lib/translators/base';
import { VariableDelimiters, VariablesBucket } from '@/types';

import { version } from '../../../package.json';

/**
 * ValidatorProxy emulates the interpolate + ajv-validation combo.
 * It is essentially a validation function that can have an `errors`
 * attribute (just as the `Ajv.ValidationFunc`).
 */
type ValidatorProxy = {
  (step: PipelineStep): boolean | PromiseLike<any>;
  errors?: ValidationError[] | null;
};

export default defineComponent({
  name: 'base-step-form',

  components: {
    StepFormHeader,
    StepFormButtonbar,
  },

  props: {
    translator: {
      type: String,
      default: 'pandas',
    },
    isStepCreation: {
      type: Boolean,
      default: true,
    },
    initialStepValue: {
      type: Object,
      default: null,
    },
    stepFormDefaults: {
      type: Object,
      default: undefined,
    },
    backendError: {
      type: String,
      default: undefined,
    },
    columnTypes: {
      type: Object as PropType<ColumnTypeMapping>,
      default: () => ({}),
    },
    selectedColumns: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket>,
      default: undefined,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    variables: {
      type: Object as PropType<ScopeContext>,
      default: () => ({}),
    },
    availableDomains: {
      type: Array as PropType<{ name: string; uid: string }[]>,
      default: () => [],
    },
    unjoinableDomains: {
      type: Array as PropType<{ name: string; uid: string }[]>,
      default: () => [],
    },
    interpolateFunc: {
      type: Function as PropType<InterpolateFunction>,
      default: (e: any) => e,
    },
    getColumnNamesFromPipeline: {
      type: Function as PropType<(pipelineNameOrDomain: string | ReferenceToExternalQuery) => Promise<string[] | undefined>>,
      default: () => Promise.resolve([]),
    },
  },

  data() {
    return {
      version,
      selectedColumnAttrName: null as string | null,
      title: '',
      editedStep: { ...this.initialStepValue, ...this.stepFormDefaults },
      editedStepModel: {} as object,
      errors: null as ValidationError[] | null,
      stepname: '',
      validator: (() => false) as ValidatorProxy,
    };
  },

  computed: {
    columnNames(): string[] {
      return Object.keys(this.columnTypes);
    },
    stepSelectedColumn: {
      get(): string | null {
        return null;
      },
      set(_newval: string | null) {
        // default implementation is a noop
      },
    },
  },

  watch: {
    selectedColumns: {
      handler(val: string[], oldVal: string[]) {
        if (val.length > 0 && !_.isEqual(val, oldVal)) {
          this.stepSelectedColumn = val[0];
        }
      },
    },
  },

  created() {
    this.initialize();
  },

  mounted() {
    if (this.isStepCreation && this.selectedColumns.length > 0) {
      this.stepSelectedColumn = this.selectedColumns[0];
    }
    // shortcut to trigger the submit method: `ctr||command+enter`
    this.$el.addEventListener('keydown', ((event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code == 'Enter') {
        this.submit();
      }
    }) as EventListener);
  },

  methods: {
    initialize() {
      const column = this.stepSelectedColumn;
      if (column) {
        this.setSelectedColumns({ column });
      }
    },

    updateSelectedColumn(_colname: string) {
      // default implementation is a noop
    },

    setSelectedColumns({ column }: { column: string | undefined }) {
      this.$emit('setSelectedColumns', { column });
    },

    validate() {
      const ret = this.validator({ ...this.editedStep });
      if (ret === false) {
        return this.validator.errors;
      }
      return null;
    },

    cancelEdition() {
      this.$emit('back');
    },

    submit() {
      this.editedStepModel = schemaFactory(this.stepname, this);
      const ajv = new Ajv({ allErrors: true, strictSchema: false });
      addAjvKeywords(ajv);
      const ajvValidator: ValidateFunction<object> = ajv.compile(this.editedStepModel);
      const interpolator = new PipelineInterpolator(this.interpolateFunc, this.variables);
      const interpolateAndValidate: ValidatorProxy = function(step: PipelineStep) {
        const ret = ajvValidator(interpolator.interpolateStep(step));
        interpolateAndValidate.errors = ajvValidator.errors?.map(ajvErrorsToValidationError);
        return ret;
      };
      this.validator = interpolateAndValidate;
      const errors = this.validate();
      this.errors = errors;
      if (errors === null) {
        this.$emit('formSaved', { ...this.editedStep });
      }
    },
  },
});
</script>
