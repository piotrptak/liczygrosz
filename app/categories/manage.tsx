import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { confirmAction, showMessage } from '@/utils/dialogs';
import { createCategory, deleteCategory, fetchCategories, type TxType } from '@/lib/api';
import { keys, queryClient } from '@/lib/queryClient';
import { errorKey } from '@/utils/errors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManageCategories() {
    const { t } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const { data: categories = [] } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });
    const [isModalVisible, setModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('cart');
    const [selectedColor, setSelectedColor] = useState(colors.tint);
    const [type, setType] = useState<TxType>('expense');

    // Valid Ionicons names
    const icons = ['cart', 'home', 'car', 'restaurant', 'airplane', 'heart', 'game-controller', 'briefcase', 'school', 'gift', 'medical', 'paw', 'construct', 'barbell'];
    const palette = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93', '#2C2C2E'];

    const refresh = () => queryClient.invalidateQueries({ queryKey: keys.categories });

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name) {
            showMessage(t('error'), t('category_name_required'));
            return;
        }
        // Transactions reference categories by name, so names must be unique.
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            showMessage(t('error'), t('category_exists'));
            return;
        }

        try {
            await createCategory({ name, type, icon: selectedIcon, color: selectedColor });
            setModalVisible(false);
            setNewCategoryName('');
            refresh();
        } catch (error) {
            console.error(error);
            showMessage(t('error'), t(errorKey(error)));
        }
    };

    const handleDelete = (id: string) => {
        confirmAction(t('delete_category_title'), t('delete_category_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteCategory(id);
                refresh();
            } catch (error) {
                showMessage(t('error'), t(errorKey(error)));
            }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScreenHeader title={t('categories_title')} />
            <View style={styles.body}>

            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ {t('new_category')}</Text>
            </TouchableOpacity>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={[styles.iconContainer, { backgroundColor: item.color || colors.secondary }]}>
                            {/* Render Ionicons safely */}
                            <Ionicons name={item.icon as any || 'ellipse'} size={18} color="#FFF" />
                        </View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.categoryType, { color: item.type === 'income' ? colors.success : colors.textSecondary }]}>{t(item.type)}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />
            </View>

            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{t('new_category')}</Text>

                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        placeholder={t('category_name')}
                        placeholderTextColor={colors.textSecondary}
                        maxLength={40}
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('type')}</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setType('expense')} style={[styles.typeButton, { borderColor: colors.border }, type === 'expense' && { backgroundColor: colors.error }]}>
                            <Text style={{ color: type === 'expense' ? '#FFF' : colors.text }}>{t('expense')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setType('income')} style={[styles.typeButton, { borderColor: colors.border }, type === 'income' && { backgroundColor: colors.success }]}>
                            <Text style={{ color: type === 'income' ? '#FFF' : colors.text }}>{t('income')}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('icon')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                        {icons.map(icon => (
                            <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.pickerItem, { borderColor: colors.border }, selectedIcon === icon && { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                                <Ionicons name={icon as any} size={24} color={colors.text} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('color')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                        {palette.map(color => (
                            <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} style={[styles.colorItem, { backgroundColor: color }, selectedColor === color && { borderWidth: 2, borderColor: colors.text }]} />
                        ))}
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                            <Text style={{ color: colors.text }}>{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddCategory} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    body: { flex: 1, paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
    addButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    list: { paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    categoryName: { flex: 1, fontSize: 16, fontWeight: '600' },
    categoryType: { fontSize: 12, marginRight: 10, textTransform: 'uppercase' },
    deleteButton: { padding: 8 },

    modalContainer: { flex: 1, padding: 24, paddingTop: 40, width: '100%', maxWidth: 640, alignSelf: 'center' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 18, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeButton: { padding: 12, borderRadius: 20, flex: 1, alignItems: 'center', borderWidth: 1 },
    pickerScroll: { marginBottom: 24, maxHeight: 60 },
    pickerItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1 },
    colorItem: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 40 },
    modalButton: { padding: 16, borderRadius: 16, width: '45%', alignItems: 'center' }

});
