<template>
  <div class="widget-multiinputtext__container">
    <label class="widget-multiinputtext__label" :for="id">{{ name }}</label>
    <multiselect
      v-model="editedValue"
      :options="options"
      :multiple="true"
      :taggable="true"
      :close-on-select="false"
      :placeholder="placeholder"
      @input="clearOptions"
      @search-change="updateOptions"
    >
      <template slot="noOptions">{{ placeholder }}</template>
    </multiselect>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Multiselect from 'vue-multiselect';

@Component({
  name: 'multi-input-text-widget',
  components: {
    Multiselect,
  },
})
export default class MultiInputTextWidget extends Vue {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ type: Array, default: () => [] })
  value!: string[];

  editedValue: string[] = [];
  options: string[] = [];

  clearOptions() {
    this.options = [];
  }

  updateOptions(newVal: string) {
    if (newVal.length > 0) {
      this.options = [newVal];
    }
  }

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string[]) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string[]) {
    this.$emit('input', newValue);
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss">
@import '../../../styles/_variables';
.widget-multiinputtext__container {
  @extend %form-widget__container;
  position: relative;
}

.multiselect {
  color: $base-color-light;
  font-size: 14px;
}

.multiselect .multiselect__placeholder {
  margin-bottom: 0;
  color: $grey-dark;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.multiselect__single {
  background-color: transparent;
  color: $base-color-light;
  font-size: 14px;
  margin-bottom: 0;
}

.multiselect--active {
  & > .multiselect__tags {
    @extend %form-widget__field--focused;
  }
}

.multiselect__option {
  font-size: 14px;
  box-shadow: inset 0 -1px 0 0 #f1f1f1;
  &:after {
    display: none;
  }
}

.multiselect__option--selected {
  background-color: $active-color;
  color: $base-color-light;
  font-weight: normal;
  color: #fff;
}

.multiselect__option--selected.multiselect__option--highlight {
  background-color: $active-color;
  color: #fff;
}

.multiselect__option--highlight {
  background-color: #f8f8f8;
  color: $base-color-light;
}

.widget-multiinputtext__label {
  @extend %form-widget__label;
}

.multiselect__tags {
  @extend %form-widget__field;
  border-radius: 0;
  border: none;
  font-size: 14px;
  max-height: none;
  display: block;
  padding-right: 30px;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      color: $grey-dark;
    }
  }
}

.multiselect__tags .multiselect__tag {
  background: $active-color;
}

.multiselect__tags .multiselect__tag-icon {
  background: $active-color;
  &:after {
    color: rgba(255, 255, 255, 0.75);
  }
  &:hover {
    background: $active-color;
  }
}
</style>
