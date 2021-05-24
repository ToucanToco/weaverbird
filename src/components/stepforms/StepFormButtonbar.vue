<template functional>
  <div>
    <div class="widget-form-action">
      <button
        class="widget-form-action__button widget-form-action__button--validate"
        data-cy="weaverbird-step-form-validate"
        @click="parent.submit()"
      >
        Save changes
      </button>
    </div>
  </div>
</template>
<script>
export default {};
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.widget-form-action {
  display: flex;
  flex-direction: column;
}

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
  margin-bottom: 20px;
}
</style>
