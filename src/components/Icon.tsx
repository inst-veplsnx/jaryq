import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const Icon: React.FC<IconProps> = React.memo(({ name, size = 24, color }) => (
  <Ionicons name={name} size={size} color={color} accessible={false} />
));

export default Icon;
