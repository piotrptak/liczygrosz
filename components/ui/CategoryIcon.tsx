import { radius } from '@/constants/theme';
import {
    Baby, Banknote, BookOpen, Briefcase, Bus, Car, Coffee, Dumbbell, Film, Fuel, Gamepad2, Gift, GraduationCap,
    HandCoins, HeartPulse, House, Landmark, PawPrint, PiggyBank, Plane, Receipt, Shirt, ShoppingCart, Smartphone,
    Tag, Utensils, Wrench, Zap, type LucideIcon,
} from '@/components/ui/icons';
import React from 'react';
import { View } from 'react-native';

// Icons offered for categories; the key is what gets stored in the database.
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    'shopping-cart': ShoppingCart,
    utensils: Utensils,
    coffee: Coffee,
    house: House,
    receipt: Receipt,
    zap: Zap,
    car: Car,
    fuel: Fuel,
    bus: Bus,
    plane: Plane,
    'heart-pulse': HeartPulse,
    dumbbell: Dumbbell,
    'graduation-cap': GraduationCap,
    'book-open': BookOpen,
    'gamepad-2': Gamepad2,
    film: Film,
    shirt: Shirt,
    smartphone: Smartphone,
    gift: Gift,
    baby: Baby,
    'paw-print': PawPrint,
    wrench: Wrench,
    banknote: Banknote,
    briefcase: Briefcase,
    'hand-coins': HandCoins,
    landmark: Landmark,
    'piggy-bank': PiggyBank,
    tag: Tag,
};

// Names used by earlier versions (Ionicons).
const LEGACY: Record<string, string> = {
    'cash-outline': 'banknote', 'briefcase-outline': 'briefcase', 'fast-food-outline': 'utensils',
    'car-sport-outline': 'car', 'game-controller-outline': 'gamepad-2', 'cart-outline': 'shopping-cart',
    'receipt-outline': 'receipt', cart: 'shopping-cart', home: 'house', car: 'car', restaurant: 'utensils',
    airplane: 'plane', heart: 'heart-pulse', 'game-controller': 'gamepad-2', briefcase: 'briefcase',
    school: 'graduation-cap', gift: 'gift', medical: 'heart-pulse', paw: 'paw-print', construct: 'wrench',
    barbell: 'dumbbell',
};

export const categoryIcon = (name?: string | null): LucideIcon =>
    (name && (CATEGORY_ICONS[name] ?? CATEGORY_ICONS[LEGACY[name]])) || Tag;

export const CATEGORY_COLORS = ['#4F46E5', '#0EA5E9', '#14B8A6', '#10B981', '#84CC16', '#F59E0B', '#F97316', '#EF4444', '#EC4899', '#A855F7', '#64748B'];

type Props = { icon?: string | null; color?: string | null; size?: number };

/** Rounded tile with the category's color as a tint and its icon in full color. */
export default function CategoryIcon({ icon, color, size = 40 }: Props) {
    const Icon = categoryIcon(icon);
    const tint = color || '#64748B';
    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size >= 44 ? radius.lg : radius.md,
                backgroundColor: tint + '1F',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Icon size={Math.round(size * 0.5)} color={tint} strokeWidth={2} />
        </View>
    );
}
