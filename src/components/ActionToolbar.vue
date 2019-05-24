<template>
  <div class="action-toolbar__container">
    <div class="action-toolbar">
      <button type="button" class="action-toolbar__btn action-toolbar__btn--special">
        <i class="action-toolbar__btn-icon fas fa-plus"></i>
        <span class="action-toolbar__btn-txt">Column</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-filter"></i>
        <span class="action-toolbar__btn-txt">Filter</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-calculator"></i>
        <span class="action-toolbar__btn-txt">Compute</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-font"></i>
        <span class="action-toolbar__btn-txt">Text</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-calendar"></i>
        <span class="action-toolbar__btn-txt">Date</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-code-branch"></i>
        <span class="action-toolbar__btn-txt">Aggregate</span>
      </button>

      <button type="button" class="action-toolbar__btn">
        <i class="action-toolbar__btn-icon fas fa-draw-polygon"></i>
        <span class="action-toolbar__btn-txt">Reshape</span>
      </button>

      <div class="action-toolbar__search">
        <i class="action-toolbar__search-icon fas fa-search"></i>
        <input class="action-toolbar__search-input" type="text" placeholder="Search">
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
@Component({
  name: 'action-toolbar',
})
export default class ActionToolbar extends Vue {
  data() {
    return {
      buttons: [],
    };
  }
}
</script>
<style lang="scss">
.action-toolbar {
  display: flex;
  margin-bottom: 15px;
  margin-right: 15px;
  justify-content: space-between;
}

.action-toolbar__btn {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #fafafa;
  color: #2a66a1;
  padding: 10px 0;
  text-align: center;
  margin-left: 5px;
  width: 75px;
  &:focus {
    outline: none;
  }
}

.action-toolbar__btn--special {
  background: none;
  border: 1px dashed #999999;
  color: #999999;
  margin-left: 0;
}

.action-toolbar__btn-icon {
  font-size: 18px;
  margin-bottom: 6px;
}

.action-toolbar__btn-icon--reshape {
  background: url(../assets/reshape-icon.png) no-repeat;
  display: inline-block;
  width: 16px;
  height: 15px;
}

.action-toolbar__btn-txt {
  display: block;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.action-toolbar__search {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #f0f0f0;
  color: #999999;
  padding-left: 5px;
  align-self: center;
  margin-left: 10px;
}

.action-toolbar__search-icon {
  vertical-align: middle;
}

.action-toolbar__search-input {
  background: none;
  border: 0;
  color: #999999;
  line-height: 25px;
  margin: 3px 0 3px 5px;
  &:focus {
    outline: none;
  }
}
</style>
