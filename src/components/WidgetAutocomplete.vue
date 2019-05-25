<template>
  <div class="widget-autocomplete__container">
    <label class="widget-autocomplete__label" :for="id">{{ name }}</label>
    <multiselect v-model="editedValue" :options="options" :placeholder="placeholder"></multiselect>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Multiselect from 'vue-multiselect';

@Component({
  name: 'widget-autocomplete',
  components: {
    Multiselect,
  },
})
export default class WidgetAutocomplete extends Vue {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ type: String, default: '' })
  value!: string;

  @Prop({ type: Array, default: () => [] })
  options!: string[];

  editedValue: string = '';

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string) {
    this.$emit('input', newValue);
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss">
@import '../styles/_variables';

.widget-autocomplete__container {
  @extend %form-widget__container;
  position: relative;
}

.multiselect__placeholder {
  margin-bottom: 0;
  color: #a7a7a7;
}

.multiselect__tags {
  @extend %form-widget__field;
  border-radius: 0;
  border: none;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      color: #a7a7a7;
    }
  }
}

.multiselect__single {
  background-color: transparent;
  margin-bottom: 0;
}

.multiselect--active {
  & > .multiselect__tags {
    @extend %form-widget__field--focused;
  }
}

.multiselect__option--highlight {
  background-color: $active-color;
}
.multiselect__option--highlight::after {
  background-color: $active-color;
}

.widget-autocomplete__label {
  @extend %form-widget__label;
}

</style>
