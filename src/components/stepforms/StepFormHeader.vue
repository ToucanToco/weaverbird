<template>
  <div class="step-edit-form">
    <div class="step-edit-form__container">
      <button class="step-edit-form__back-button" @click="cancelEdition">
        <i class="fas fa-angle-left" aria-hidden="true" />
        BACK
      </button>
      <div class="step-edit-form__title-container">
        <h1>{{ title }}</h1>
        <a
          class="step-edit-form__link"
          :href="`https://weaverbird.toucantoco.com/docs/${stepName}`"
          target="_blank"
          rel="noopener"
          :data-version="version"
        >
          <i class="fas fa-question-circle" aria-hidden="true" />
        </a>
      </div>
      <div class="step-edit-form__empty" />
    </div>
    <div v-if="backendError" class="step-edit-form__error">
      <strong>{{ backendError }}</strong>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
@Component({
  name: 'step-form-header',
  components: {},
})
export default class StepFormHeader extends Vue {
  @Prop()
  backendError!: string | undefined;

  @Prop({ default: '' })
  version!: string;

  @Prop({ default: '' })
  title!: string;

  @Prop({ default: '' })
  stepName!: string;

  cancelEdition(): void {
    /* istanbul ignore next */
    (this.$parent as any).cancelEdition(); // TODO: refactor (old functional logic)
  }
}
</script>

<style lang="scss" scoped>
@import '../../styles/_variables';

.step-edit-form {
  margin: 10px 0 15px;
}

.step-edit-form__container {
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid $grey;
  width: 100%;
}

.step-edit-form__back-button {
  background: none;
  align-items: center;
  border: none;
  color: #404040;
  display: flex;
  flex: 1;
  font-family: Montserrat, sans-serif;
  font-size: 14px;
  font-weight: 600;

  &:hover {
    cursor: pointer;
  }
}

.step-edit-form__empty {
  // For alignment purposes
  flex: 1;
}

.step-edit-form__title-container {
  display: flex;
  align-items: center;

  h1 {
    color: $base-color;
    font-weight: 600;
    font-size: 17px;
    margin: 0;
  }
}

.fas.fa-angle-left {
  font-size: 19px;
  margin-right: 5px;
}

.fas.fa-question-circle {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}

.step-edit-form__error {
  background-color: $error-light;
  border-left: 2px solid $error;
  padding: 15px;
  font-size: 13px;
  margin-top: 15px;
}
</style>
