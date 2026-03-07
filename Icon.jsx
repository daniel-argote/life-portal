import { icons } from 'lucide-react';

const Icon = ({ name, color, size, className }) => {
  const LucideIcon = icons[name];

  if (!LucideIcon) {
    // Fallback or error logging
    return null;
  }

  return <LucideIcon color={color} size={size} className={className} />;
};

export default Icon;