import { Alert, Platform } from 'react-native';

// Alert.alert is a no-op in react-native-web, so fall back to the browser dialogs there.

export const showMessage = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
        window.alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

export const confirmAction = (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void
) => {
    if (Platform.OS === 'web') {
        if (window.confirm(`${title}\n\n${message}`)) onConfirm();
        return;
    }
    Alert.alert(title, message, [
        { text: cancelText, style: 'cancel' },
        { text: confirmText, style: 'destructive', onPress: onConfirm },
    ]);
};
