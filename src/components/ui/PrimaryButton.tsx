import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, disabled, ...props }) => {
  return (
    <TouchableOpacity
      className={`bg-blue-600 rounded-full py-3 px-6 items-center justify-center ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Text className="text-white font-bold text-base">
        {title}
      </Text>
    </TouchableOpacity>
  );
};
