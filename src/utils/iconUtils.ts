import { Car, Truck, Wrench, Settings, Zap, Cog, Hammer, Gauge } from 'lucide-react';

// Available Lucide icons
export const availableIcons = [
  { name: 'Car', component: Car },
  { name: 'Truck', component: Truck },
  { name: 'Wrench', component: Wrench },
  { name: 'Settings', component: Settings },
  { name: 'Zap', component: Zap },
  { name: 'Cog', component: Cog },
  { name: 'Hammer', component: Hammer },
  { name: 'Gauge', component: Gauge }
];

// Get icon component by name
export const getIconComponent = (iconName: string) => {
  const icon = availableIcons.find(i => i.name === iconName);
  return icon ? icon.component : Car;
};