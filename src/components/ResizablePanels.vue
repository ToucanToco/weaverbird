<template>
  <div class="resizable-panels">
    <div class="resizable-panels__panel" :style="leftPanelWidth">
      <slot name="left-panel">Left panel</slot>
    </div>

    <div class="resizable-panels__resizer" @mousedown="startResize()">
      <div class="resizable-panels__line" />
    </div>

    <div class="resizable-panels__panel" :style="rightPanelWidth">
      <slot name="right-panel">Right panel</slot>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({
  name: 'resizable-panels',
})
export default class ResizablePanels extends Vue {
  private ratio = 0.4;

  get leftPanelWidth() {
    return {
      width: `${this.ratio * 100}%`,
    };
  }

  get rightPanelWidth() {
    return {
      width: `${(1 - this.ratio) * 100}%`,
    };
  }

  startResize() {
    const containerWith = this.$el.getBoundingClientRect().width;

    const mousemoveListener = (e: MouseEvent) => {
      this.ratio = this.ratio + e.movementX / containerWith;
    };

    const mouseupListener = () => {
      window.removeEventListener('mousemove', mousemoveListener);
      window.removeEventListener('mouseup', mouseupListener);
      window.removeEventListener('blur', mouseupListener);
    };

    window.addEventListener('mousemove', mousemoveListener);
    window.addEventListener('mouseup', mouseupListener);
    window.addEventListener('blur', mouseupListener);
  }
}
</script>
<style lang="scss" scoped>
.resizable-panels {
  display: flex;
  max-height: 100%;
  height: 100%;
  position: relative;
}

.resizable-panels__panel {
  padding: 10px 15px;
  max-height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.resizable-panels__resizer {
  display: flex;
  justify-content: space-around;
  width: 5px;
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(0, 0, 0, 0.3);
  cursor: ew-resize;
}

.resizable-panels__line {
  width: 1px;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
