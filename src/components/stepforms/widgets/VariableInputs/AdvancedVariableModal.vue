<template>
  <div class="vqb-modal" v-if="isOpened">
    <div class="vqb-modal__backdrop" />
    <div class="vqb-modal__container">
      <div class="vqb-modal__body" style="width: 500px;">
        <em class="vqb-modal__close fas fa-times" @click="close" />
        <div class="vqb-modal__header">
          <div class="vqb-modal__title">Custom Variable</div>
        </div>
        <div class="vqb-modal__section">
          <!-- <InputTextWidget
            class="nameInput"
            v-model="variable.name"
            name="Variable name"
            placeholder
            data-path=".name"
            :errors="errors"
          /> -->
          <CodeEditorWidget
            class="codeInput"
            v-model="variable.code"
            placeholder="Write your custom variable here"
            :errors="errors"
            data-path=".code"
          />
          <AutocompleteWidget
            name="Return result as"
            class="typeInput"
            :value="selectedType"
            @input="updateType"
            :options="types"
            :trackBy="`type`"
            :label="`label`"
            placeholder
            data-path=".type"
            :errors="errors"
          />
        </div>
        <div class="vqb-modal__footer">
          <div class="vqb-modal__action vqb-modal__action--secondary" @click="close">
            cancel
          </div>
          <div class="vqb-modal__action vqb-modal__action--primary" @click="save">
            save
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import CodeEditorWidget from '@/components/stepforms/widgets/CodeEditorWidget.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { AdvancedVariable, VariableDelimiters, VariableType } from '@/lib/variables';
/**
 * This component allow to add an advanced variable
 */
@Component({
  name: 'advanced-variable-modal',
  components: {
    CodeEditorWidget,
    InputTextWidget,
  },
})
export default class AdvancedVariableModal extends Vue {
  variable: AdvancedVariable = { type: '', code: '' };

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ default: false })
  isOpened!: boolean;

  @Prop({ default: () => ({ start: '{{', end: '}}' }) })
  variableDelimiters!: VariableDelimiters;

  // TODO: populate variable types in store
  readonly types: VariableType[] = [
    { type: '', label: 'Text' },
    { type: ' | number', label: 'Number' },
  ];

  get selectedType() {
    return this.types.find((type: VariableType) => type.type === this.variable.type);
  }

  /*
  Format variable to emit new value as string
  */
  get formattedVariable(): string {
    // add type and delimiters only if type is not default one
    if (this.variable.type) {
      return `${this.variableDelimiters.start} ${this.variable.code}${this.variable.type} ${this.variableDelimiters.end}`;
    } else {
      return this.variable.code;
    }
  }

  // See https://vuejs.org/v2/guide/components.html#Circular-References-Between-Components
  beforeCreate() {
    this.$options.components['AutocompleteWidget'] = AutocompleteWidget;
  }

  updateType(type: VariableType) {
    this.variable.type = type.type;
  }

  close() {
    this.$emit('closed');
  }

  save() {
    // TODO: raise error if no code provided
    this.$emit('input', this.formattedVariable);
  }
}
</script>

<style lang="scss" scoped>
@import '../../../../styles/_variables';

.vqb-modal {
  bottom: 0;
  display: flex;
  flex-direction: column;
  left: 0;
  overflow: auto;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 999;
}

.vqb-modal__backdrop {
  background-color: rgba(0, 0, 0, 0.54);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
}

.vqb-modal__container {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  min-height: 100%;
  padding: 40px 40px 20px;
  width: 100%;
}

.vqb-modal__body {
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  position: relative;
}

.vqb-modal__close {
  color: #4c4c4c;
  font-size: 30px;
  position: absolute;
  top: 15px;
  right: 30px;
}

.fa-times {
  cursor: pointer;
}

.vqb-modal__header {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  display: flex;
  padding: 20px 30px;
  box-shadow: inset 0 -1px 0 0 #f5f5f5;
}

.vqb-modal__title {
  font-size: 18px;
  letter-spacing: 0.25px;
  line-height: 20px;
  color: #4c4c4c;
  font-weight: 700;
}

.vqb-modal__section {
  box-shadow: inset 0 -1px 0 0 #f5f5f5;
  padding: 25px 0;
}

.vqb-modal__text {
  font-size: 14px;
  letter-spacing: 0.25px;
  line-height: 22px;
  color: #4c4c4c;
  font-weight: 400;
}

strong.vqb-modal__text {
  display: block;
  font-weight: 700;
}

.vqb-modal__footer {
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  display: flex;
  justify-content: center;
  padding: 30px;
}

.vqb-modal__action {
  font-size: 12px;
  letter-spacing: 0.25px;
  line-height: 20px;
  cursor: pointer;
  font-weight: 700;
  padding: 10px 30px;
  text-transform: uppercase;
}

.vqb-modal__action--secondary {
  background-color: #f5f5f5;
  color: #a5a5a5;
  margin-right: 20px;
  border: none;
}

.vqb-modal__action--primary {
  background-color: $active-color;
  color: #fff;
  border: none;
}

.nameInput {
  padding: 0 30px;
  /deep/ .widget-input-text__label label {
    text-transform: uppercase;
    color: #6a6a6a;
    font-weight: 600;
    font-size: 12px;
  }
}

.codeInput {
  height: 200px;

  /deep/ .view-lines,
  /deep/ .margin {
    background: #fafafa;
  }

  /deep/ .glyph-margin {
    background: #eeeeee;
  }
}

.typeInput {
  flex-direction: row;
  align-items: center;
  margin-bottom: 0;
  padding: 0 30px;

  /deep/ .widget-autocomplete__label {
    flex: 0 auto;
    padding-right: 20px;
  }

  /deep/ .widget-input-variable {
    width: auto;
    flex: 0 auto;
    min-width: 120px;
  }
}
</style>
