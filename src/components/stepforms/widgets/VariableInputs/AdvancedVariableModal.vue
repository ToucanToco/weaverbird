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
          <CodeEditorWidget
            class="codeInput"
            v-model="value"
            placeholder="Write your custom variable here"
            :errors="errors"
            data-path=".code"
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

import CodeEditorWidget from '@/components/stepforms/widgets/CodeEditorWidget.vue';
/**
 * This component allow to add an advanced variable
 */
@Component({
  name: 'advanced-variable-modal',
  components: { CodeEditorWidget },
})
export default class AdvancedVariableModal extends Vue {
  value = '';

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ default: false })
  isOpened!: boolean;

  close() {
    this.$emit('closed');
  }

  save() {
    this.close();
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
}

.vqb-modal__title {
  font-size: 18px;
  letter-spacing: 0.25px;
  line-height: 20px;
  color: #4c4c4c;
  font-weight: 700;
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

.codeInput {
  height: 200px;
  margin: 0;

  /deep/ .view-lines,
  /deep/ .margin {
    background: #fafafa;
  }

  /deep/ .glyph-margin {
    background: #eeeeee;
  }
}
</style>
