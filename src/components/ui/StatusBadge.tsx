import React from 'react';
import { View, Text } from 'react-native';

export type TripStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED';

interface StatusBadgeProps {
  status: TripStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let bgColorClass = 'bg-gray-500';
  let label = status;

  switch (status) {
    case 'ON_TIME':
      bgColorClass = 'bg-emerald-500';
      label = 'On Time';
      break;
    case 'DELAYED':
      bgColorClass = 'bg-orange-500';
      label = 'Delayed';
      break;
    case 'CANCELLED':
      bgColorClass = 'bg-red-500';
      label = 'Cancelled';
      break;
  }

  return (
    <View className={`${bgColorClass} px-3 py-1 rounded-full items-center justify-center`}>
      <Text className="text-white font-bold text-xs uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
};
