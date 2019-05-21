<template>
  <div class="action-toolbar__container">
    <div class="action-toolbar__list">
      <div class="action-toolbar__item" v-for="button in buttons">
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({
  name: 'action-toolbar'
})
export default class ActionToolbar extends Vue {
  data() {
    return {
      buttons: []
    }
  }
}
</script>
<style lang="scss">
  @import '../styles/ActionToolbar';
</style>
