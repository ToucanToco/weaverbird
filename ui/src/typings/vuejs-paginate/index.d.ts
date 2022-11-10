/**
 * type declaration for the vuejs-paginate module *
 */

declare module 'vuejs-paginate' {
  import { Vue, Component, Prop } from 'vue-property-decorator';

  @Component({
    name: 'paginate',
  })
  export default class Paginate extends Vue {
    @Prop({ type: Number })
    pageCount: number;

    @Prop({ type: Number, default: 3 })
    pageRange: number;

    @Prop({ type: Number, default: 1 })
    marginPages: number;

    @Prop({ type: String, default: 'Prev' })
    prevText: string;

    @Prop({ type: String, default: 'Next' })
    nextText: string;

    @Prop({ type: String, default: '…' })
    breakViewText: string;

    @Prop({ type: Number })
    forcePage: number;

    @Prop({ type: Function })
    clickHandler: (pageno: number) => void;

    @Prop({ type: String })
    containerClass: string;
  }
}
