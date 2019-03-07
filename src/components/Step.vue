<template>
  <div class="query-pipeline-step__container">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass"></div>
      <div :class="classDot" @click="select()">
        <div :class="classDotInk"></div>
      </div>
      <div :class="lastStrokeClass"></div>
    </div>
    <div :class="classStep">
      <span class="query-pipeline-step__name">{{ step.name }}</span>
      <div class="query-pipeline-step__actions">
        <div class="query-pipeline-step__action">
          <i class="fas fa-cog"></i>
        </div>
        <div class="query-pipeline-step__action">
          <i class="fas fa-trash-alt"></i>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'step',
  props: {
    isFirst: Boolean,
    isLast: Boolean,
    isActive: {
      type: Boolean,
      default: false
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
    step: Object,
  },
  computed: {
    classDot() {
      return {
        'query-pipeline-queue__dot': true,
        'query-pipeline-queue__dot--active': this.isActive,
        'query-pipeline-queue__dot--disabled': this.isDisabled,
      };
    },
    classDotInk() {
      return {
        'query-pipeline-queue__dot-ink': true,
        'query-pipeline-queue__dot-ink--active': this.isActive,
        'query-pipeline-queue__dot-ink--disabled': this.isDisabled,
      };
    },
    classStep() {
      return {
        'query-pipeline-step': true,
        'query-pipeline-step--disabled': this.isDisabled,
      }
    },
    firstStrokeClass() {
      return {
        'query-pipeline-queue__stroke': true,
        'query-pipeline-queue__stroke--hidden': this.isFirst,
      };
    },
    lastStrokeClass() {
      return {
        'query-pipeline-queue__stroke': true,
        'query-pipeline-queue__stroke--hidden': this.isLast,
      };
    },
  },
  methods: {
    select() {
      this.$emit('selectedStep');
    },
  },
};
</script>
<style lang="scss" scoped>
  @import '../styles/Steps';
</style>
