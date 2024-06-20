<template>
  <div class="vqb-modal">
    <div class="vqb-modal__backdrop" />
    <div class="vqb-modal__container">
      <div class="vqb-modal__body">
        <span class="vqb-modal__close" @click="cancel"><FAIcon icon="times" /></span>
        <div class="vqb-modal__header">
          <div class="vqb-modal__title">
            <MagicIcon />
            <span class="vqb-modal__title__text">Preparation assistant</span>
          </div>
        </div>
        <div class="vqb-modal__section">
          <div class="vqb-modal__text">What transformation do you need?</div>
          <textarea
            class="vqb-modal__text-area"
            v-model="textareaValue"
            placeholder="Hey..."
          ></textarea>
        </div>
        <div class="vqb-modal__footer">
          <div
            class="vqb-modal__action vqb-modal__action--primary"
            data-cy="weaverbird-cancel-delete"
            @click="generate"
          >
            Generate
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import FAIcon from '@/components/FAIcon.vue';
// @ts-ignore
import MagicIcon from './MagicIcon.vue';

@Component({
  name: 'ai-modal',
  components: {
    MagicIcon,
    FAIcon,
  },
})
/**
 * @name AIModal
 * @description A modal asking for confirmation before deleting a step
 */
export default class AIModal extends Vue {
  textareaValue: string = '';

  cancel(): void {
    /* istanbul ignore next */
    (this.$listeners as any).cancel(); // TODO: refactor (old functional logic)
  }
  generate(): void {
    /* istanbul ignore next */
    (this.$listeners as any).generate(this.textareaValue); // TODO: refactor (old functional logic)
  }
}
</script>

<style lang="scss" scoped>
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
  align-items: center;
}

.vqb-modal__body {
  width: 520px;
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
  color: #252525;
  font-size: 25px;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;

  display: flex;
  width: 32px;
  height: 32px;

  display: flex;
  padding: 4px;
  justify-content: center;
  align-items: center;
  flex: 1 0 0;
}

.vqb-modal__header {
  display: flex;
  padding: 16px 24px;
  justify-content: space-between;
  align-items: center;

  border-radius: 4px 4px 0px 0px;
  border-bottom: 1px solid var(--neutral-20, #d3d7e0);
  background: #fff;
}

.vqb-modal__title {
  font-size: 18px;
  letter-spacing: 0.25px;
  line-height: 20px;
  color: #4c4c4c;
  font-weight: 700;

  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 0 0;
}

.vqb-modal__title__text {
  color: #252525;

  /* title-18 */
  font-family: Montserrat;
  font-size: 18px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 21.6px */
}

.vqb-modal__section {
  display: flex;
  padding: 24px;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  align-self: stretch;
}

.vqb-modal__text {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  color: #252525;
  /* body-14 */
  font-family: Montserrat;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 21px */
}

.vqb-modal__footer {
  display: flex;
  height: 72px;
  padding: 16px 24px;
  justify-content: flex-end;
  align-items: center;

  border-radius: 0px 0px 4px 4px;
  border-top: 1px solid var(--neutral-20, #d3d7e0);
  background: var(--Colors-Light, #fdfdff);
}

.vqb-modal__action {
  font-size: 12px;
  letter-spacing: 0.25px;
  line-height: 20px;
  cursor: pointer;
  font-weight: 700;
  text-transform: uppercase;

  display: flex;
  height: 40px;
  padding: 12px 16px;
  align-items: center;
  gap: 4px;
}

.vqb-modal__action--primary {
  border-radius: 4px;
  background: var(--Primary-50, #88b2a8);
}
.vqb-modal__text-area {
  display: flex;
  height: 115px;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  align-self: stretch;

  color: var(--neutral-50, #677692);

  /* body-14 */
  font-family: Montserrat;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 21px */
}
</style>
