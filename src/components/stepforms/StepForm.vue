<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Prop, Component, Watch } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import { MutationCallbacks } from '@/store/mutations';
import { Pipeline } from '@/lib/steps';
import { PipelineStep } from '@/lib/steps';

type VqbError = Partial<ErrorObject>;

/**
 * build a proxy on a Vue component instance that will automatically
 * bind an instance.
 */
function componentProxyBoundOn(self: Vue) {
  return {
    get: function (target: any, prop: string) {
      const value = target.options.methods[prop];
      // it should be a function (@Component will put methods in the `options`
      // property), but check it to be sure
      if (typeof value === 'function') {
        // then if it's a function, bind it to the instance
        return value.bind(self);
      }
      return value;
    }
  }
}

@Component
export default class BaseStepForm extends Vue {

  @Prop({ type: Boolean, default: true })
  isStepCreation!: boolean;

  @Prop({ type: Object, default: null })
  initialStepValue!: PipelineStep | null;

  @State pipeline!: Pipeline;
  @State selectedStepIndex!: number;

  @Mutation selectStep!: (payload: { index: number }) => void;
  @Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  @Getter columnNames!: string[];
  @Getter computedActiveStepIndex!: number;
  @Getter selectedColumns!: string[];

  readonly selectedColumnAttrName: string | null = null;
  readonly title: string = '';
  editedStep: PipelineStep | null = null;
  editedStepModel!: object;
  errors?: VqbError[] | null = null;
  validator: ValidateFunction = () => false;

  mounted() {
    this.validator = Ajv({ schemaId: 'auto', allErrors: true }).compile(this.editedStepModel);
  }

  created() {
    const column = this.stepSelectedColumn;
    if (column) {
      this.setSelectedColumns({ column });
    }
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

  get stepSelectedColumn() {
    return null;
  }

  set stepSelectedColumn(_newval: string | null) {
  }

  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (!_.isEqual(val, oldVal)) {
      this.stepSelectedColumn = val[0];
    }
  }

  updateSelectedColumn(_colname: string) { }

  rebuildStep() {
    return { ... this.editedStep };
  }

  stepToValidate() {
    return { ...this.editedStep };
  }

  validate() {
    const ret = this.validator(this.stepToValidate());
    if (ret === false) {
      return this.validator.errors;
    }
    return null;
  }

  cancelEdition() {
    this.$emit('cancel');
    const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
    this.selectStep({ index: idx });
  }

  submit() {
    const errors = this.validate();
    this.errors = errors;
    if (errors === null) {
      this.$emit('formSaved', this.rebuildStep());
    }
  }
}


</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
}

.step-edit-form {
  border-bottom: 1px solid $grey;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 20px;
  margin: 10px 0 15px;
  width: 100%;
}

.step-edit-form__title {
  color: $base-color;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
</style>
