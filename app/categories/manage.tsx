import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ManageCategories() {
    const db = useSQLiteContext();
    const router = useRouter();
    const { t } = useLocalization();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [categories, setCategories] = useState<any[]>([]);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('circle');
    const [selectedColor, setSelectedColor] = useState(colors.tint);
    const [type, setType] = useState('expense');

    // Valid Ionicons names
    const icons = ['cart', 'home', 'car', 'restaurant', 'airplane', 'heart', 'game-controller', 'briefcase', 'school', 'gift', 'medical', 'paw', 'construct', 'barbell'];
    const palette = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55', '#8E8E93', '#2C2C2E'];

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const result = await db.getAllAsync('SELECT * FROM categories ORDER BY id DESC');
        setCategories(result);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        try {
            await db.runAsync(
                'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
                [newCategoryName, type, selectedIcon, selectedColor]
            );
            setModalVisible(false);
            setNewCategoryName('');
            loadCategories();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add category');
        }
    };

    const handleDelete = async (id: number) => {
        Alert.alert(
            'Delete Category',
            'Are you sure? Existing transactions will remain but may lose their category styling.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
                        loadCategories();
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.text }]}>{t('categories_title')}</Text>
            </View>

            <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+ New Category</Text>
            </TouchableOpacity>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.card, { backgroundColor: colors.surface }]}>
                        <View style={[styles.iconContainer, { backgroundColor: item.color || colors.secondary }]}>
                            {/* Render Ionicons safely */}
                            <Ionicons name={item.icon as any || 'ellipse'} size={18} color="#FFF" />
                        </View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                        <Text style={[styles.categoryType, { color: colors.textSecondary }]}>{item.type}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.list}
            />

            <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>

                    <TextInput
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        placeholder="Category Name"
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                    />

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                    <View style={styles.row}>
                        <TouchableOpacity onPress={() => setType('expense')} style={[styles.typeButton, type === 'expense' && { backgroundColor: colors.error }]}>
                            <Text style={{ color: type === 'expense' ? '#FFF' : colors.text }}>Expense</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setType('income')} style={[styles.typeButton, type === 'income' && { backgroundColor: colors.success }]}>
                            <Text style={{ color: type === 'income' ? '#FFF' : colors.text }}>Income</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Icon</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                        {icons.map(icon => (
                            <TouchableOpacity key={icon} onPress={() => setSelectedIcon(icon)} style={[styles.pickerItem, selectedIcon === icon && { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                                <Ionicons name={icon as any} size={24} color={colors.text} />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                        {palette.map(color => (
                            <TouchableOpacity key={color} onPress={() => setSelectedColor(color)} style={[styles.colorItem, { backgroundColor: color }, selectedColor === color && { borderWidth: 2, borderColor: colors.text }]} />
                        ))}
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                            <Text style={{ color: colors.text }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddCategory} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    backButton: { marginRight: 16 },
    title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'SpaceMono' },
    addButton: { padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
    addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    list: { paddingBottom: 40 },
    card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12 },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    categoryName: { flex: 1, fontSize: 16, fontWeight: '600' },
    categoryType: { fontSize: 12, marginRight: 10, textTransform: 'uppercase' },
    deleteButton: { padding: 8 },

    modalContainer: { flex: 1, padding: 24, paddingTop: 40 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
    input: { padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 18, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    typeButton: { padding: 12, borderRadius: 20, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    pickerScroll: { marginBottom: 24, maxHeight: 60 },
    pickerItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#eee' },
    colorItem: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', marginBottom: 40 },
    modalButton: { padding: 16, borderRadius: 16, width: '45%', alignItems: 'center' }

});
