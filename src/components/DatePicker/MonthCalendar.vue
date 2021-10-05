<template>
  <div class="month-calendar" data-cy="weaverbird-month-calendar">
    <div class="month-calendar__header">
      <div class="month-calendar__header-btn" data-cy="weaverbird-month-calendar__previous">
        <FAIcon icon="chevron-left" />
      </div>
      {{ headerLabel }}
      <div class="month-calendar__header-btn" data-cy="weaverbird-month-calendar__next">
        <FAIcon icon="chevron-right" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Component, Vue } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';

@Component({
  name: 'month-calendar',
  components: {
    FAIcon,
  },
})
export default class MonthCalendar extends Vue {
  get headerLabel(): string {
    return DateTime.now().year;
  }
}
</script>

<style scoped lang="scss">
.month-calendar {
  box-sizing: border-box;
  width: 330px;
}

.month-calendar__header {
  display: flex;
  justify-content: space-between;
  height: 40px;
  align-items: center;
}

.month-calendar__header-btn {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #f8f7fa;
  }
}
</style>
