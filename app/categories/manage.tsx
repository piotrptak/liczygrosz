import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CategoryIcon, { CATEGORY_COLORS, CATEGORY_ICONS } from '@/components/ui/CategoryIcon';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import ListRow from '@/components/ui/ListRow';
import Screen from '@/components/ui/Screen';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Sheet from '@/components/ui/Sheet';
import Skeleton from '@/components/ui/Skeleton';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { layout, radius, space, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { createCategory, deleteCategory, fetchCategories, type TxType } from '@/lib/api';
import { keys, queryClient } from '@/lib/queryClient';
import { confirmAction, showMessage, showSuccess } from '@/utils/dialogs';
import { errorKey } from '@/utils/errors';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Check, Plus, Tag, Tags, Trash2 } from '@/components/ui/icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function ManageCategories() {
    const { t } = useLocalization();
    const { colors } = useTheme();
    const { data: categories = [], isPending } = useQuery({ queryKey: keys.categories, queryFn: fetchCategories });

    const [filter, setFilter] = useState<TxType>('expense');
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [type, setType] = useState<TxType>('expense');
    const [icon, setIcon] = useState('shopping-cart');
    const [color, setColor] = useState(CATEGORY_COLORS[0]);
    const [saving, setSaving] = useState(false);

    const visible = categories.filter(c => c.type === filter);
    const refresh = () => queryClient.invalidateQueries({ queryKey: keys.categories });

    const openSheet = () => {
        setName('');
        setNameError(null);
        setType(filter);
        setIcon(filter === 'income' ? 'banknote' : 'shopping-cart');
        setColor(CATEGORY_COLORS[0]);
        setOpen(true);
    };

    const handleAdd = async () => {
        const trimmed = name.trim();
        if (!trimmed) return setNameError(t('category_name_required'));
        // Transactions reference categories by name, so names must be unique.
        if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return setNameError(t('category_exists'));

        setSaving(true);
        try {
            await createCategory({ name: trimmed, type, icon, color });
            await refresh();
            setOpen(false);
            setFilter(type);
            showSuccess(t('category_added'));
        } catch (e) {
            showMessage(t('error'), t(errorKey(e)));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        confirmAction(t('delete_category_title'), t('delete_category_message'), t('delete'), t('cancel'), async () => {
            try {
                await deleteCategory(id);
                await refresh();
            } catch (e) {
                showMessage(t('error'), t(errorKey(e)));
            }
        });
    };

    return (
        <Screen
            title={t('categories_title')}
            backTo="/(tabs)/profile"
            width={layout.formWidth + 80}
            actions={<Button label={t('new')} icon={Plus} size="sm" onPress={openSheet} />}
        >
            <SegmentedControl<TxType>
                value={filter}
                onChange={setFilter}
                options={[
                    { value: 'expense', label: t('expense'), icon: ArrowUpRight, tone: 'expense' },
                    { value: 'income', label: t('income'), icon: ArrowDownLeft, tone: 'income' },
                ]}
            />

            {isPending ? (
                <Skeleton height={240} rounded={radius.lg} />
            ) : visible.length === 0 ? (
                <Card>
                    <EmptyState icon={Tags} title={t('no_categories_title')} actionLabel={t('new_category')} actionIcon={Plus} onAction={openSheet} />
                </Card>
            ) : (
                <Card padded={false}>
                    {visible.map((cat, i) => (
                        <ListRow
                            key={cat.id}
                            leading={<CategoryIcon icon={cat.icon} color={cat.color} />}
                            title={cat.name}
                            divider={i > 0}
                            trailing={<IconButton icon={Trash2} label={`${t('delete')} ${cat.name}`} tone="danger" onPress={() => handleDelete(cat.id)} size={36} />}
                        />
                    ))}
                </Card>
            )}

            <Sheet
                visible={open}
                onClose={() => setOpen(false)}
                title={t('new_category')}
                footer={
                    <>
                        <Button label={t('cancel')} variant="secondary" onPress={() => setOpen(false)} style={{ flex: 1 }} />
                        <Button label={t('save')} icon={Check} onPress={handleAdd} loading={saving} style={{ flex: 1 }} />
                    </>
                }
            >
                <View style={[styles.preview, { backgroundColor: colors.surfaceMuted }]}>
                    <CategoryIcon icon={icon} color={color} size={48} />
                    <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>{name.trim() || t('category_name')}</Text>
                </View>

                <TextField
                    label={t('category_name')}
                    icon={Tag}
                    value={name}
                    onChangeText={(v) => { setName(v); setNameError(null); }}
                    error={nameError}
                    maxLength={40}
                    autoFocus
                />

                <View style={{ gap: 6 }}>
                    <Text variant="label" tone="secondary">{t('type')}</Text>
                    <SegmentedControl<TxType>
                        value={type}
                        onChange={setType}
                        options={[
                            { value: 'expense', label: t('expense'), tone: 'expense' },
                            { value: 'income', label: t('income'), tone: 'income' },
                        ]}
                    />
                </View>

                <View style={{ gap: 6 }}>
                    <Text variant="label" tone="secondary">{t('icon')}</Text>
                    <View style={styles.grid} accessibilityRole="radiogroup">
                        {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => {
                            const active = icon === key;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => setIcon(key)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: active }}
                                    accessibilityLabel={key}
                                    style={[styles.iconOption, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }]}
                                >
                                    <Icon size={20} color={active ? colors.primaryText : colors.textSecondary} />
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                <View style={{ gap: 6 }}>
                    <Text variant="label" tone="secondary">{t('color')}</Text>
                    <View style={styles.grid} accessibilityRole="radiogroup">
                        {CATEGORY_COLORS.map(c => (
                            <Pressable
                                key={c}
                                onPress={() => setColor(c)}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: color === c }}
                                accessibilityLabel={c}
                                style={[styles.swatch, { backgroundColor: c }, color === c && { borderColor: colors.text, borderWidth: 3 }]}
                            >
                                {color === c && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </Sheet>
        </Screen>
    );
}

const styles = StyleSheet.create({
    preview: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    iconOption: { width: 44, height: 44, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    swatch: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
});
