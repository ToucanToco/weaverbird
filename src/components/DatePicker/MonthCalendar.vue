<template>
  <div class="month-calendar" data-cy="weaverbird-month-calendar">
    <div class="month-calendar__header">
      <div
        class="month-calendar__header-btn header-btn__previous"
        data-cy="weaverbird-month-calendar__previous"
        @click="selectPreviousHeaderDate"
      >
        <FAIcon icon="chevron-left" />
      </div>
      {{ headerLabel }}
      <div
        class="month-calendar__header-btn header-btn__next"
        data-cy="weaverbird-month-calendar__next"
        @click="selectNextHeaderDate"
      >
        <FAIcon icon="chevron-right" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { DateTime } from 'luxon';
import { Component, Prop, Vue } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';

@Component({
  name: 'month-calendar',
  components: {
    FAIcon,
  },
})
export default class MonthCalendar extends Vue {
  @Prop()
  initialDate!: Date | undefined;

  headerDate: DateTime = DateTime.now();

  get headerLabel(): string {
    return this.headerDate.year;
  }

  selectPreviousHeaderDate() {
    this.headerDate = this.headerDate.minus({ year: 1 });
  }

  selectNextHeaderDate() {
    this.headerDate = this.headerDate.plus({ year: 1 });
  }

  created() {
    if (this.initialDate) this.headerDate = DateTime.fromJSDate(this.initialDate);
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
