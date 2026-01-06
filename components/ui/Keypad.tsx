import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface KeypadProps {
    onPress: (val: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
}

export default function Keypad({ onPress, onDelete, onSubmit }: KeypadProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                {keys.map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.key, { backgroundColor: colors.surface }]}
                        onPress={() => onPress(key)}
                    >
                        <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                    </TouchableOpacity>
                ))}
                {/* Delete Key */}
                <TouchableOpacity
                    style={[styles.key, { backgroundColor: colors.surface }]}
                    onPress={onDelete}
                >
                    <Ionicons name="backspace-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Submit Button inside Keypad area for reachability */}
            <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={onSubmit}
            >
                <Ionicons name="checkmark" size={24} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const { width } = Dimensions.get('window');
const keySize = (width - 100) / 3; // Smaller keys, more horizontal padding

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 40,
        paddingBottom: 30, // Lift slightly
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    key: {
        width: keySize,
        height: keySize * 0.6, // Shorter height
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        // Remove shadow for flatter look or keep subtle
        backgroundColor: 'transparent',
    },
    keyText: {
        fontSize: 24,
        fontWeight: '500',
    },
    submitButton: {
        width: '100%',
        height: 50, // Smaller button
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    }
});
