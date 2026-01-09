import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FA_ICONS } from '@/assets/FA-ICONS';

export default function FAIcon({ icon, className }: { icon: string, className?: string }) {
  const iconObj = FA_ICONS[icon];
  if (!iconObj) {
      console.warn(`Icon ${icon} not found in FA_ICONS`);
      return null;
  }
  return <FontAwesomeIcon icon={iconObj} className={className} />;
}
