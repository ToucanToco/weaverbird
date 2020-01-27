<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'form-widget',
})
export default class FormWidget extends Vue {
  @Prop({ type: String })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ type: String, default: () => '' })
  warning!: string;

  get error() {
    if (this.errors === null || this.errors === undefined) {
      return undefined;
    } else {
      return this.errors.find(d => d.dataPath == this.dataPath);
    }
  }

  get messageError() {
    if (this.error !== undefined) {
      return this.error.message;
    }
    return null;
  }

  get messageWarning() {
    if (this.warning) {
      return this.warning;
    }
    return null;
  }

  get toggleClassErrorWarning() {
    // We returnn this warning class only if there is not an error class to return. The latter must take precedence
    return {
      'field--error': this.messageError !== undefined && this.messageError !== null,
      'field--warning':
        !(this.messageError !== undefined && this.messageError !== null) &&
        this.warning !== undefined &&
        this.warning !== null &&
        this.warning !== '',
    };
  }
}
</script>

<style lang="scss">
.field--error .widget-input-text,
.field--error .multiselect__tags {
  box-shadow: 0 0 0 1px #d40000 inset;
}
.field__msg-error {
  color: #d40000;
  font-size: 12px;
  margin-top: 5px;
}
.field__msg-error .fa-exclamation-circle {
  margin-right: 5px;
}

.field--warning .widget-input-text,
.field--warning .multiselect__tags {
  box-shadow: 0 0 0 1px #ff8800 inset;
}

.field__msg-warning {
  color: #ff8800;
  font-size: 12px;
  margin-top: 5px;
}

.field__msg-warning .fa-exclamation-triangle {
  margin-right: 5px;
}
</style>
