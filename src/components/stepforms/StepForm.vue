<script lang="ts">
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import _ from 'lodash';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

import schemaFactory from '@/components/stepforms/schemas';
import { addAjvKeywords } from '@/components/stepforms/schemas/utils';
import StepFormButtonbar from '@/components/stepforms/StepFormButtonbar.vue';
import StepFormHeader from '@/components/stepforms/StepFormHeader.vue';
import { Pipeline, PipelineStep } from '@/lib/steps';
import { InterpolateFunction, PipelineInterpolator, ScopeContext } from '@/lib/templating';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import { version } from '../../../package.json';

type VqbError = Partial<ErrorObject>;
/**
 * ValidatorProxy emulates the interpolate + ajv-validation combo.
 * It is essentially a validation function that can have an `errors`
 * attribute (just as the `Ajv.ValidationFunc`).
 */
type ValidatorProxy = {
  (step: PipelineStep): boolean | PromiseLike<any>;
  errors?: ErrorObject[] | null;
};

/**
 * build a proxy on a Vue component instance that will automatically
 * bind an instance.
 */
function componentProxyBoundOn(self: Vue) {
  return {
    get: function(target: any, prop: string) {
      const value = target.options.methods[prop];
      // it should be a function (@Component will put methods in the `options`
      // property), but check it to be sure
      if (typeof value === 'function') {
        // then if it's a function, bind it to the instance
        return value.bind(self);
      }
      return value;
    },
  };
}

/**
 * Simple abstract base class for all step forms. `BaseStepForm` implements some
 * default basic 'submit' / 'back' event callbacks and map some of the props /
 * getters / state and mutations from the store that you'll most of the time
 * need in your concrete step form implementation:
 * - `@VQBModule.State selectedStepIndex`
 * - `@VQBModule.Getter pipeline`
 * - `@VQBModule.Action selectStep`
 * - `@VQBModule.Mutation setSelectedColumns`.
 *
 * This class provides a default `mounted()` hook that is used to bind the `Ajv`
 * validator that will be used on submit. It provides 2 default callbacks:
 * - `cancelEdition` that will trigger a `back` event and restore the selected
 *   step as its former value
 * - `submit` that will trigger a `formSaved` event with the step object if
 *   validation passes. Default validation is handled by the `validate` method
 *   that return errors found by `Ajv` or `null` if everything's fine.
 *
 * The edited step is defined by the `editedStep` data property and its schema
 * in the `editedStepModel` one. A property `initialStepValue` should be passed
 * to the form component to initialize `editedStep` correctly.
 *
 * The form title is defined by the `title` data property;
 *
 * Finally, should you need to override `submit`, `validate` or any other method
 * in your concrete step form class, you can always call the base class
 * implementation using the `$$super` property, e.g. `this.$$super.validate()`.
 * Note that default `super` javascript keyword is not usable here since the
 * `@Component` decorator will flatten options properties of parent and child
 * classes in a single dict.
 */
@Component({
  components: {
    StepFormHeader,
    StepFormButtonbar,
  },
})
export default class BaseStepForm<StepType> extends Vue {
  version = version; // display the current version of the package

  @Prop({ type: Boolean, default: true })
  isStepCreation!: boolean;

  @Prop({ type: Object, default: null })
  initialStepValue!: StepType;

  @Prop({ type: Object, default: undefined })
  stepFormDefaults!: Partial<StepType>;

  @Prop({ type: String, default: undefined })
  backendError?: string;

  @VQBModule.State interpolateFunc!: InterpolateFunction;
  @VQBModule.State selectedStepIndex!: number;
  @VQBModule.State variables!: ScopeContext;

  @VQBModule.Action selectStep!: (payload: { index: number }) => void;
  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  @VQBModule.Getter columnNames!: string[];
  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter pipeline!: Pipeline;
  @VQBModule.Getter selectedColumns!: string[];

  readonly selectedColumnAttrName: string | null = null;
  readonly title: string = '';
  editedStep: StepType = { ...this.initialStepValue, ...this.stepFormDefaults };
  editedStepModel!: object;
  errors?: VqbError[] | null = null;
  stepname!: string; // needs to be added by each Step!
  validator: ValidateFunction = () => false;

  created() {
    this.initialize();
  }

  initialize() {
    const column = this.stepSelectedColumn;
    if (column) {
      this.setSelectedColumns({ column });
    }
  }

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
  }

  /**
   * The `$$super` property will return a javascript proxy that should bind
   * the current `this` instance on the method implentation found on the baseclass.
   *
   * This is required because otherwise `@Component` will flatten the prototype chain
   * and we won't be able to access the base class anymore. Of course, this relies on
   * the idea that `$$super` must not be overridden on a subclass. Furthermore, current
   * implementation assumes that we won't go deeper than 1 level of subclassing.
   *
   * Expected usage:
   * ```
   * @Component
   * class MyForm extends BaseStepForm {
   *   submit() {
   *     this.$$super.submit(); // ← call base class implementation
   *     console.log('after base implementation');
   *   }
   * }
   * ```
   */
  get $$super() {
    return new Proxy(BaseStepForm, componentProxyBoundOn(this));
  }

  /**
   * `stepSelectedColumn` is a get / set property that is used for step forms
   * that should be bound to a given column. In that case, this property should
   * get / set the corresponding column field in the step (e.g. the `oldname` field
   * of a "rename" step).
   */
  get stepSelectedColumn() {
    return null;
  }

  set stepSelectedColumn(_newval: string | null) {
    // default implementation is a noop, we would not what to do by default with
    // the new selected column.
  }

  /**
   * when selected column is changed, update corresponding field in the step
   * with the `stepSelectedColumn` property.
   */
  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (val.length > 0 && !_.isEqual(val, oldVal)) {
      this.stepSelectedColumn = val[0];
    }
  }

  updateSelectedColumn(_colname: string) {
    // default implementation is a noop, we would not what to do by default with
    // the new selected column.
  }

  /**
   * `validate` calls `Ajv`. If there are some errors, return them, otherwise
   * return `null`.
   */
  validate() {
    const ret = this.validator({ ...this.editedStep });
    if (ret === false) {
      return this.validator.errors;
    }
    return null;
  }

  /**
   * `cancelEdition` emits the `back` event and reset the edited step
   * as it was before the edition.
   */
  cancelEdition() {
    this.$emit('back');
    const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
    this.selectStep({ index: idx });
  }

  /**
   * default callback that should be called when `ok` is clicked. It first
   * validates the edited step. If there are some errors, update the
   * corresponding `errors` data property. Otherwise, emit the `formSaved` event
   * with the edited step.
   */
  submit() {
    this.editedStepModel = schemaFactory(this.stepname, this);
    const ajv = Ajv({ schemaId: 'auto', allErrors: true });
    addAjvKeywords(ajv);
    const ajvValidator = ajv.compile(this.editedStepModel);
    const interpolator = new PipelineInterpolator(this.interpolateFunc, this.variables);
    const interpolateAndValidate: ValidatorProxy = function(step: PipelineStep) {
      const ret = ajvValidator(interpolator.interpolateStep(step));
      interpolateAndValidate.errors = ajvValidator.errors;
      return ret;
    };
    this.validator = interpolateAndValidate;
    const errors = this.validate();
    this.errors = errors;
    if (errors === null) {
      this.$emit('formSaved', { ...this.editedStep });
    }
  }
}
</script>
