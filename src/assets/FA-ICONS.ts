/* Every icons from font-awesome should be declared here to be used as svg (check the FAIcon component to add it to template) */
import {
  faCalendar as faCalendarFar,
  faClock as faClockFar,
  faTrashAlt as faTrashAltFar,
} from '@fortawesome/free-regular-svg-icons';
import {
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faArrowRight,
  faCalculator,
  faCalendar,
  faCalendarAlt,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCodeBranch,
  faCog,
  faDrawPolygon,
  faExclamation,
  faExclamationCircle,
  faExclamationTriangle,
  faFilter,
  faFont,
  faGripVertical,
  faMagic,
  faObjectGroup,
  faPlus,
  faQuestionCircle,
  faSearch,
  faSyncAlt,
  faTimes,
  faTrash,
  faVial,
} from '@fortawesome/free-solid-svg-icons';

/* List all icons used in app */
const FA_ICONS = {
  // Solid icons (default)
  'angle-down': faAngleDown,
  'angle-left': faAngleLeft,
  'angle-right': faAngleRight,
  'arrow-right': faArrowRight,
  calculator: faCalculator,
  calendar: faCalendar,
  'calendar-alt': faCalendarAlt,
  check: faCheck,
  'chevron-left': faChevronLeft,
  'chevron-right': faChevronRight,
  'code-branch': faCodeBranch,
  cog: faCog,
  'draw-polygon': faDrawPolygon,
  exclamation: faExclamation,
  'exclamation-circle': faExclamationCircle,
  'exclamation-triangle': faExclamationTriangle,
  filter: faFilter,
  font: faFont,
  'grip-vertical': faGripVertical,
  magic: faMagic,
  'object-group': faObjectGroup,
  plus: faPlus,
  'question-circle': faQuestionCircle,
  search: faSearch,
  'sync-alt': faSyncAlt,
  times: faTimes,
  trash: faTrash,
  vial: faVial,
  // Regular icons (should always use `far ` prefix)
  'far calendar': faCalendarFar,
  'far trash-alt': faTrashAltFar,
  'far clock': faClockFar,
};

export const FA_ICONS_PACK = Object.values(FA_ICONS);
export const FA_ICONS_NAMES = Object.keys(FA_ICONS);
export type FAIconName = typeof FA_ICONS_NAMES[number];
