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
<style scoped>
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
  height: 70px;
  width: 100%;
}

.query-pipeline-queue {
  position: relative;
  margin-right: 20px;
  height: 100%;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
}

.query-pipeline-queue__dot {
  background-color: rgb(245, 245, 245);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s;
}

.query-pipeline-queue__dot--active {
  background-color: rgba(38, 101, 163, 0.1);
  animation: scaler 0.3s;
}

.query-pipeline-queue__dot--disabled,
.query-pipeline-queue__dot-ink--disabled,
.query-pipeline-step--disabled {
  opacity: .5;
}

.query-pipeline-queue__dot-ink {
  background-color: rgb(154, 154, 154);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.query-pipeline-queue__dot-ink--active {
  background-color: #2665a3;
}

.query-pipeline-queue__stroke {
  width: 2px;
  flex-grow: 1;
  justify-self: end;
  background-color: rgb(245, 245, 245);
}

.query-pipeline-queue__stroke--hidden {
  visibility: hidden;
}

.query-pipeline-step {
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  padding-left: 12px;
  justify-content: space-between;
  align-items: center;
  background-color: rgb(245, 245, 245);
}

.query-pipeline-step__name {
  font-weight: bold;
  text-transform: capitalize;
  color: rgb(154, 154, 154);
}

.query-pipeline-step__actions {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.query-pipeline-step__action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 40px;
  background-color: rgba(239, 239, 239);
  color: rgb(154, 154, 154);
}

.query-pipeline-step__action i {
  cursor: pointer;
  transition: color 0.3s ease;
}

.query-pipeline-step__action i:hover {
  color: rgb(71, 71, 71);
}

</style>
