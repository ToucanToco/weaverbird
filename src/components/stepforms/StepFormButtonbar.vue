<template functional>
  <div>
    <div class="widget-form-action">
      <button
        class="widget-form-action__button widget-form-action__button--validate"
        @click="props.submit()"
      >OK</button>
      <button
        class="widget-form-action__button widget-form-action__button--cancel"
        @click="props.cancel()"
      >Cancel</button>
    </div>
    <div v-if="props.errors" class="errors">
      <ul>
        <li
          v-for="(error, index) in props.errors"
          :key="index"
        >{{ error.dataPath }}: {{ error.message }}</li>
      </ul>3
    </div>
  </div>
</template>
<script>
export default {};
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
}
</style>
