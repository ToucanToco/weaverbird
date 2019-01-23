<template>
  <div class="query-pipeline-step__container">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass"></div>
      <div class="query-pipeline-queue__dot"></div>
      <div :class="lastStrokeClass"></div>
    </div>
    <div class="query-pipeline-step">
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
    step: Object,
    isFirst: Boolean,
    isLast: Boolean,
  },
  computed: {
    firstStrokeClass() {
      return {
        'query-pipeline-queue__stroke': true,
        'query-pipeline-queue__stroke--hidden': this.isFirst,
      }
    },
    lastStrokeClass() {
      return {
        'query-pipeline-queue__stroke': true,
        'query-pipeline-queue__stroke--hidden': this.isLast,
      }
    }
  }
}
</script>
<style scoped>
  .query-pipeline-step__container {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 70px;
  }

  .query-pipeline-queue {
    position: relative;
    width: 50px;
    height: 100%;
    flex-direction: column;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .query-pipeline-queue__dot {
    background-color: rgb(71, 71, 71);
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .query-pipeline-queue__stroke {
    width: 2px;
    flex-grow: 1;
    justify-self: end;
    background-color: rgb(71, 71, 71);
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
    color: rgb(71, 71, 71);
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
    transition: color .3s ease;
  }

  .query-pipeline-step__action i:hover {
    color: rgb(71, 71, 71);
  }


  /* .query-pipeline-step--active {

  } */

</style>
