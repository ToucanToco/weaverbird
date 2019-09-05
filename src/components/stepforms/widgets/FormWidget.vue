<script lang="ts">

import { Component, Vue, Prop } from 'vue-property-decorator';
import { ErrorObject } from 'ajv';

@Component({
  name: 'form-widget',
})
export default class FormWidget extends Vue {
  @Prop({ type: String })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  get error() {
    if(this.errors === null || this.errors === undefined) {
      return;
    } else {
      return this.errors.find(d => d.dataPath == this.dataPath);
    }
  }

  get messageError() {
    if(this.error !== undefined) {
      return this.error.message;
    }
    return null;
  }

  get toggleClassError() {
    return { 'field--error': this.messageError !== undefined && this.messageError !== null  };
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
</style>
