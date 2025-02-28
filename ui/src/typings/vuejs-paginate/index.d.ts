/**
 * type declaration for the vuejs-paginate module *
 */

declare module 'vuejs-paginate' {
  import { DefineComponent } from 'vue';

  interface PaginateProps {
    pageCount: number;
    pageRange: number;
    marginPages: number;
    prevText: string;
    nextText: string;
    breakViewText: string;
    forcePage: number;
    clickHandler: (pageno: number) => void;
    containerClass: string;
  }

  const Paginate: DefineComponent<PaginateProps>;
  export default Paginate;
}
