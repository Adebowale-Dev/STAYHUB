import React from 'react';
import { View } from 'react-native';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';

interface Props extends ButtonProps {
    fullWidth?: boolean;
}

export function Button({ fullWidth, style, ...props }: Props) {
    return (
        <View className={fullWidth ? 'w-full' : undefined}>
            <PaperButton
                style={[style, { borderRadius: 16 }]}
                contentStyle={{ minHeight: 50, paddingHorizontal: 10 }}
                labelStyle={{ fontSize: 14, fontWeight: '800', letterSpacing: 0.2 }}
                {...props}
            />
        </View>
    );
}
