import { shallowMount, Wrapper } from '@vue/test-utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import DatePicker from 'v-calendar/lib/components/date-picker.umd';

import Calendar from '@/components/DatePicker/Calendar.vue';

describe('Calendar', () => {
  let wrapper: Wrapper<Calendar>;
  const createWrapper = (props: any = {}): void => {
    wrapper = shallowMount(Calendar, {
      sync: false,
      propsData: {
        value: undefined,
        isRange: false,
        ...props,
      },
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    const defaultValue = new Date();
    beforeEach(() => {
      createWrapper({ value: defaultValue });
    });

    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should instantiate a DatePicker', () => {
      expect(wrapper.find(DatePicker).exists()).toBe(true);
    });
    it('should pass value to DatePicker', () => {
      expect(wrapper.find(DatePicker).props().value).toStrictEqual(defaultValue);
    });
    it('should forward event from the date picker', () => {
      const value = new Date('2021-11-29T00:00:00Z');
      wrapper.find(DatePicker).vm.$emit('input', value);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual(new Date('2021-11-29T00:00:00.000Z'));
    });
    it('should not display highlighted dates', () => {
      const attributes = (wrapper.vm as any).highlights;
      expect(attributes).toHaveLength(0);
    });
  });

  describe('is range', () => {
    const defaultValue = { start: new Date(), end: new Date(1) };
    beforeEach(() => {
      createWrapper({
        value: defaultValue,
        isRange: true,
      });
    });
    it('should active DatePicker as range', () => {
      expect(wrapper.find(DatePicker).props().isRange).toBe(true);
    });
    it('should pass value to DatePicker', () => {
      expect(wrapper.find(DatePicker).props().value).toStrictEqual(defaultValue);
    });
    it('should emit new value when datepicker is updated', () => {
      const value = {
        start: new Date('2021-09-08T00:00:00Z'),
        end: new Date('2021-11-29T23:59:59Z'),
      };
      wrapper.find(DatePicker).vm.$emit('input', value);
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({
        start: new Date('2021-09-08T00:00:00Z'),
        end: new Date('2021-11-29T23:59:59Z'),
        duration: 'day',
      });
    });
    it('should emit start date only when datepicker is dragged (range update)', () => {
      const value = { start: new Date('2021-09-08T00:00:00Z'), end: new Date(2) };
      (wrapper.vm as any).onDrag(value); // drag event is not found by stub
      expect(wrapper.emitted('input')[0][0]).toStrictEqual({
        start: new Date('2021-09-08T00:00:00Z'),
        duration: 'day',
      });
    });

    describe('range out of bounds', () => {
      const bounds = {
        start: new Date('2021-11-15T00:00:00Z'),
        end: new Date('2021-12-15T00:00:00Z'),
        duration: 'day',
      };

      beforeEach(() => {
        createWrapper({
          value: {
            start: new Date('2021-11-01T00:00:00Z'),
            end: new Date('2022-12-18T00:00:00Z'),
            duration: 'day',
          },
          availableDates: bounds,
          isRange: true,
        });
      });

      it('should use clamped range instead of raw value', () => {
        expect(wrapper.find(DatePicker).props('value')).toStrictEqual(bounds);
      });

      it('should emit clamped range', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0][0]).toStrictEqual(bounds);
      });

      describe('when value is completely out of updated bounds', () => {
        const updatedBounds = {
          start: new Date('09/15/2020'),
          end: new Date('10/15/2020'),
          duration: 'day',
        };
        beforeEach(async () => {
          await wrapper.setProps({
            availableDates: updatedBounds,
          });
        });
        it('should move calendar cursor to start bound', () => {
          expect(wrapper.find(DatePicker).attributes('from-date')).toStrictEqual(
            updatedBounds.start.toString(),
          );
        });
        it('should reset value', () => {
          expect(wrapper.emitted('input')).toHaveLength(2);
          expect(wrapper.emitted('input')[1][0]).toBeUndefined();
        });
      });
    });
  });

  describe('with highlighted dates', () => {
    const highlightedDates = [new Date(1), new Date(2)];
    beforeEach(() => {
      createWrapper({
        value: new Date(),
        highlightedDates,
      });
    });
    it('should display highlighted dates', () => {
      const attributes = (wrapper.vm as any).highlights;
      expect(attributes).toHaveLength(1);
      expect(attributes[0].key).toBe('highlighted');
      expect(attributes[0].dates).toStrictEqual(highlightedDates);
    });
  });

  describe('with available dates and no value', () => {
    const availableDates = { start: new Date(1000), end: new Date(20000) };
    beforeEach(() => {
      createWrapper({ availableDates });
    });
    it('should move calendar cursor to available date start', () => {
      expect(wrapper.find(DatePicker).attributes('from-date')).toStrictEqual(
        availableDates.start.toString(),
      );
    });
  });
});
