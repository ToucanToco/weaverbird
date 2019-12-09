<template functional>
  <div class="step-edit-form">
    <h1 class="step-edit-form__title">{{ props.title }}</h1>
    <a
      :href="`https://weaverbird.toucantoco.com/docs/${props.stepName}`"
      target="_blank"
      class="step-edit-form__help"
    >
      <i class="fas fa-question-circle" />
    </a>
  </div>
</template>
<script lang="ts">
export default {};
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.step-edit-form {
  border-bottom: 1px solid $grey;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 20px;
  margin: 10px 0 15px;
  width: 100%;
}

.step-edit-form__title {
  color: $base-color;
  font-weight: 600;
  font-size: 17px;
  margin: 0;
}

.fas.fa-question-circle {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}
</style>
