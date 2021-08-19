<template>
  <div class="widget-date-input">
    <div class="widget-date-input__container">
      <span class="widget-date-input__label">Last 12 month</span>
      <div class="widget-date-input__button">
        <i class="far fa-calendar" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
/**
 * This component allow to select a relative or fixed date using date components
 */
@Component({
  name: 'new-date-input',
  components: {},
})
export default class NewDateInput extends Vue {}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

$grey: #808080;
$grey-light: #d9d9d9;
$grey-extra-light: #f6f6f6;

.widget-date-input__container {
  border: 1px solid $grey-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 400px;
}
.widget-date-input__label {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.widget-date-input__button {
  padding: 10px 15px;
  background: $grey-extra-light;
  color: $grey;
  cursor: pointer;
}

.widget-date-input__container:hover {
  border-color: $active-color;
  .widget-date-input__button {
    background-color: $active-color-faded-2;
    color: $active-color;
  }
}
</style>
