<template>
  <div class="widget-multiinputtext__container">
    <multiselect
      v-model="editedValue"
      :options="options"
      :multiple="true"
      :taggable="true"
      :close-on-select="false"
      :placeholder="placeholder"
      @input="clearOptions"
      @search-change="updateOptions"
    />
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({
  name: 'multi-input-text-widget',
  components: {
    Multiselect,
  },
})
export default class MultiInputTextWidget extends Vue {
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
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  padding: 0;
  line-height: 20px;
  padding-left: 5px;
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
  height: 40px;
  overflow: hidden;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      color: $grey-dark;
    }
  }
}

.multiselect--active .multiselect__tags {
  overflow: visible;
  height: auto;
}

.widget-multiinputtext__container {
  .multiselect__content-wrapper {
    display: none !important;
  }
  .multiselect__tags {
    background: none;
    box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
    display: flex;
    position: absolute;
    overflow: hidden;
    height: 40px;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    width: 100%;
  }
  .multiselect__placeholder {
    padding: 8px 30px 8px 10px;
  }
  .multiselect__tags-wrap {
    order: 2;
    padding: 8px 30px 8px 8px;
    width: 100%;
  }
  .multiselect__input {
    border-radius: 0px;
    order: 1;
    padding: 4px 10px 11px;
    left: 0px;
    position: relative;
    box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
    height: 40px;
  }
  .multiselect--active .multiselect__tags {
    overflow: visible;
    height: auto;
  }
  .multiselect--active {
    .multiselect__tags {
      box-shadow: none;
    }
    .multiselect__tags-wrap {
      background: #fff;
      box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
      border-radius: 0 0 5px 5px;
      padding: 8px 10px;
      max-height: 200px;
      overflow-y: auto;
    }
    .multiselect__input {
      box-shadow: 0 0 0 1px #2665a3 inset;
    }
    .multiselect__tag:last-child {
      margin-bottom: 0;
    }
  }
  .multiselect__select {
    z-index: 3;
  }
}

.multiselect__select:before {
  border: 0;
  content: '\f078';
  font-family: 'Font Awesome 5 Pro', 'Font Awesome 5 Free';
  font-weight: 900;
  line-height: 1;
  top: 8px;
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
