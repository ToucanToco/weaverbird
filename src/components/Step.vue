<template>
  <div :class="classContainer">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass" />
      <div class="query-pipeline-queue__dot" @click="toggleDelete">
        <div class="query-pipeline-queue__dot-ink">
          <i class="fas fa-check" aria-hidden="true" />
        </div>
      </div>
      <div :class="lastStrokeClass" />
    </div>
    <div class="query-pipeline-step" @click="select()">
      <div class="query-pipeline-step__body">
        <span class="query-pipeline-step__name" :title="stepTitle" v-html="stepLabel" />
        <div
          class="query-pipeline-step__actions"
          :class="{
            'query-pipeline-step__actions--disabled': !isEditable,
          }"
        >
          <!-- @click.stop is used to avoid to trigger select event when editing a step -->
          <div class="query-pipeline-step__action" @click.stop="editStep()">
            <i class="far fa-cog" aria-hidden="true" />
          </div>
          <div
            class="query-pipeline-step__action query-pipeline-step__action--handle"
            v-if="!isFirst"
            @click.stop
          >
            <i class="fa fa-align-justify" aria-hidden="true" />
          </div>
        </div>
      </div>
      <div class="query-pipeline-step__footer" v-if="errorMessage && !isDisabled">
        <div class="query-pipeline-step__error" :title="errorMessage">
          <strong>ERROR</strong> - {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { humanReadableLabel, labelWithReadeableVariables } from '@/lib/labeller';
import { PipelineStep } from '@/lib/steps';
import { VariableDelimiters } from '@/lib/variables';
import { VQBModule } from '@/store';

@Component({
  name: 'step',
})
export default class Step extends Vue {
  @Prop(Boolean)
  readonly isFirst!: boolean;

  @Prop(Boolean)
  readonly isLast!: boolean;

  @Prop(Boolean)
  readonly isActive!: boolean;

  @Prop(Boolean)
  readonly isLastActive!: boolean;

  @Prop(Boolean)
  readonly isDisabled!: boolean;

  @Prop(Boolean)
  readonly toDelete!: boolean;

  @Prop({ type: Boolean, default: true })
  readonly isEditable?: boolean;

  @Prop()
  step!: PipelineStep;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop()
  readonly indexInPipeline!: number;

  @VQBModule.Getter stepConfig!: (index: number) => PipelineStep;

  @VQBModule.Getter stepErrors!: (index: number) => string | undefined;

  get stepName(): string {
    return humanReadableLabel(this.step);
  }

  get errorMessage(): string | undefined {
    return this.stepErrors(this.indexInPipeline);
  }

  get stepTitle(): string {
    const replaceDelimiters = { start: '', end: '' };
    return labelWithReadeableVariables(this.stepName, this.variableDelimiters, replaceDelimiters);
  }

  get stepLabel(): string {
    const replaceDelimiters = { start: '<em>', end: '</em>' };
    return labelWithReadeableVariables(this.stepName, this.variableDelimiters, replaceDelimiters);
  }

  get classContainer() {
    return {
      'query-pipeline-step__container': true,
      'query-pipeline-step__container--togglable': !this.isFirst,
      'query-pipeline-step__container--draggable': !this.isFirst,
      'query-pipeline-step__container--to-delete': this.toDelete,
      'query-pipeline-step__container--active': this.isActive,
      'query-pipeline-step__container--last-active': this.isLastActive,
      'query-pipeline-step__container--disabled': this.isDisabled,
      'query-pipeline-step__container--errors': this.errorMessage && !this.isDisabled,
    };
  }

  get firstStrokeClass() {
    return {
      'query-pipeline-queue__stroke': true,
      'query-pipeline-queue__stroke--hidden': this.isFirst,
    };
  }

  get lastStrokeClass() {
    return {
      'query-pipeline-queue__stroke': true,
      'query-pipeline-queue__stroke--hidden': this.isLast,
    };
  }

  editStep() {
    this.$emit('editStep', this.stepConfig(this.indexInPipeline), this.indexInPipeline);
  }

  select() {
    this.$emit('selectedStep');
  }

  toggleDelete(): void {
    if (!this.isFirst) this.$emit('toggleDelete');
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

@keyframes scaler {
  0% {
    transform: scale(0);
  }

  100% {
    transform: scale(1);
  }
}

.query-pipeline-step__container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 60px;
  width: 100%;
  flex-shrink: 0;
}

.query-pipeline-queue {
  position: relative;
  padding: 0 4px;
  margin-right: 20px;
  height: 100%;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
}

.query-pipeline-queue__dot {
  background-color: $active-color-faded-2;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: scale(1);
  transition: transform 0.2s;
}

.query-pipeline-queue__dot-ink {
  background-color: $active-color-faded;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  color: white;
  transform: width 0.2s, height 0.2s;
  i {
    visibility: hidden;
  }
}

.query-pipeline-queue__stroke {
  width: 2px;
  flex-grow: 1;
  justify-self: end;
  background-color: $active-color-faded-2;
}

.query-pipeline-queue__stroke--hidden {
  visibility: hidden;
}

.query-pipeline-step {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border-radius: 5px;
  border: 1px solid $grey;
  background-color: white;
}

.query-pipeline-step__body {
  cursor: pointer;
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  padding-left: 12px;
  justify-content: space-between;
  align-items: center;
}

.query-pipeline-step__name {
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.query-pipeline-step__actions {
  display: flex;
  flex-direction: row;
  height: 100%;
  opacity: 1;
  transition: opacity 0.2s;
}

.query-pipeline-step__actions--disabled {
  opacity: 0.3;
  cursor: not-allowed;
  .query-pipeline-step__action {
    pointer-events: none;
  }
}

.query-pipeline-step__action {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 100%;
  width: 40px;
  color: $grey-medium;
  border-right: 1px solid $grey;

  &:hover {
    color: $grey-dark;
  }

  &:last-child {
    border-right: none;
  }
}

.query-pipeline-step__action i {
  transition: color 0.3s ease;
}

.query-pipeline-step__footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 12px;
  height: 30px;
}

.query-pipeline-step__error {
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.query-pipeline-step__container--to-delete,
.query-pipeline-step__container--togglable:hover {
  .query-pipeline-queue__dot {
    transform: scale(1.3);
    cursor: pointer;
  }
  .query-pipeline-queue__dot-ink {
    width: 16px;
    height: 16px;
    border: 2px solid;
  }
}

.query-pipeline-step__container--togglable:hover {
  .query-pipeline-queue__dot-ink {
    background-color: white;
    border-color: $active-color-faded;
  }
}

.query-pipeline-step__container--to-delete,
.query-pipeline-step__container--to-delete:hover {
  .query-pipeline-queue__dot-ink {
    background-color: $active-color-faded;
    border-color: $active-color-faded;
    i {
      visibility: visible;
    }
  }
}

.query-pipeline-step__container--last-active {
  .query-pipeline-step {
    background: $active-color-faded-3;
    border-color: $active-color-faded-2;
    color: $active-color;
  }
  .query-pipeline-step__action {
    color: $active-color-faded;
    border-right-color: $active-color-faded-2;
    &:hover {
      color: $active-color;
    }
  }
  .query-pipeline-queue__dot {
    background-color: $active-color-faded-2;
  }
  .query-pipeline-queue__dot-ink {
    background-color: $active-color;
  }
  &.query-pipeline-step__container--togglable:hover {
    .query-pipeline-queue__dot-ink {
      border-color: $active-color;
    }
  }

  &.query-pipeline-step__container--to-delete,
  &.query-pipeline-step__container--to-delete:hover {
    .query-pipeline-queue__dot-ink {
      background-color: $active-color;
      border-color: $active-color;
    }
  }
}
.query-pipeline-step__container--errors {
  height: 90px;
  .query-pipeline-step {
    background: $error-light;
    border-color: $error;
    color: $grey-dark;
  }
  .query-pipeline-step__footer {
    background-color: $error;
  }
  .query-pipeline-step__action {
    color: $error;
    border-right-color: $error;
    &:hover {
      color: $grey-dark;
    }
  }
  .query-pipeline-queue__dot {
    background-color: $error-light;
  }
  .query-pipeline-queue__dot-ink {
    background-color: $error;
  }

  &.query-pipeline-step__container--togglable:hover {
    .query-pipeline-queue__dot-ink {
      border-color: $error;
    }
  }

  &.query-pipeline-step__container--to-delete,
  &.query-pipeline-step__container--to-delete:hover {
    .query-pipeline-queue__dot-ink {
      background-color: $error;
      border-color: $error;
    }
  }
}

.query-pipeline-step__container--disabled {
  .query-pipeline-step {
    background: #f5f5f5;
  }
  .query-pipeline-queue__dot {
    background-color: $grey;
  }
  .query-pipeline-queue__dot-ink {
    background: $grey-dark;
  }
  .query-pipeline-queue__dot,
  .query-pipeline-queue__dot-ink,
  .query-pipeline-step {
    opacity: 0.5;
  }

  &.query-pipeline-step__container--togglable:hover {
    .query-pipeline-queue__dot-ink {
      border-color: $grey-dark;
    }
  }

  &.query-pipeline-step__container--to-delete,
  &.query-pipeline-step__container--to-delete:hover {
    .query-pipeline-queue__dot-ink {
      background-color: $grey-dark;
      border-color: $grey-dark;
    }
  }
}
</style>
