<template>
  <div class="widget-input-variable">
    <div class="widget-input-variable__tag-container" v-if="!areOptionsVisible">
      <div class="widget-input-variable__tag">
        <span><span style="font-family: cursive">x</span> &nbsp; {{ value }}</span>
        <i class="widget-input-variable__tag-close fa fa-times" @click="$emit('removed')" />
      </div>
    </div>
    <input
      v-else
      autofocus
      class="widget-input-variable__search"
      v-model="search"
      placeholder="Search a variable"
    />
    <div>
      <popover :visible="areOptionsVisible" :align="alignLeft" bottom>
        <div class="widget-input-variable__options-container">
          <div
            class="widget-input-variable__options-section"
            v-for="optionType in filteredOptions"
            :key="optionType.type"
          >
            <div class="widget-input-variable__option-section-title">{{ optionType.type }}</div>
            <div
              class="widget-input-variable__options"
              v-for="option in optionType.values"
              :key="option.name"
              @click="$emit('input', option.name)"
            >
              <span class="widget-input-variable__options-name">{{ option.name }}</span>
              <span class="widget-input-variable__options-value">{{ option.value }}</span>
            </div>
          </div>
          <div class="widget-input-variable__advanced-variable">advanced variable</div>
        </div>
      </popover>
    </div>
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';

@Component({
  name: 'variable-input',
  components: {
    Multiselect,
    Popover,
  },
})
export default class VariableInput extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  /**
   * These option are meat to be read by from the store via a getter
   */
  readonly options = [
    {
      // type: { name: 'App variables', value: '' },
      type: 'App variables',
      values: [
        { name: 'view', value: 'Product 123' },
        { name: 'date.month', value: 'Apr' },
        { name: 'date.year', value: '2020' },
      ],
    },
    {
      // type: { name: 'Story variables', value: '' },
      type: 'Story variables',
      values: [
        { name: 'country', value: 'USA' },
        { name: 'city', value: 'New york' },
      ],
    },
  ];
  alignLeft: string = POPOVER_ALIGN.LEFT;

  search = '';

  get areOptionsVisible(): boolean {
    return this.value === '' || this.value === undefined;
  }

  get filteredOptions() {
    return this.options
      .map(optionType => ({
        type: optionType.type,
        values: optionType.values.filter(({ name }) => name.includes(this.search)),
      }))
      .filter(({ values }) => values.length > 0);
  }
}
</script>
<style lang="scss">
@import '../../../styles/_variables';
.widget-input-variable {
  width: 100%;
}

.widget-input-variable__search,
.widget-input-variable__tag-container {
  @extend %form-widget__field;
  &:focus {
    @extend %form-widget__field--focused;
  }
}

.widget-input-variable__options-container {
  display: flex;
  border-radius: 2px;
  width: 180px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
  flex-direction: column;
}

.widget-input-variable__options-section {
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 10px;
}

.widget-input-variable__option-section-title {
  font-style: italic;
  color: #888888;
  font-size: 10px;
  font-weight: 500;
}

.widget-input-variable__option-section-title,
.widget-input-variable__options,
.widget-input-variable__advanced-variable {
  padding: 12px;
}

.widget-input-variable__options {
  &:hover {
    background-color: rgba(42, 102, 161, 0.05);
    color: #2a66a1;
    .widget-input-variable__options-value {
      color: #2a66a1;
    }
  }
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.widget-input-variable__options-name {
  font-size: 12px;
  font-weight: 500;
}

.widget-input-variable__advanced-variable {
  font-size: 12px;
  font-weight: 500;
  &:hover {
    background-color: rgba(42, 102, 161, 0.05);
    color: #2a66a1;
  }
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 5px;
}

.widget-input-variable__options-value {
  font-size: 10px;
  font-weight: 500;
  color: #888888;
}

.widget-input-variable__tag {
  border-radius: 4px;
  background-color: rgba(42, 102, 161, 0.05);
  padding: 5px 10px;
  color: #2a66a1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .widget-input-variable__tag-close {
    cursor: pointer;
  }
}
</style>
