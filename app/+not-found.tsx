import EmptyState from '@/components/ui/EmptyState';
import { useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { useRouter } from 'expo-router';
import { Compass } from '@/components/ui/icons';
import { View } from 'react-native';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState icon={Compass} title={t('not_found')} actionLabel={t('go_home')} onAction={() => router.replace('/')} />
    </View>
  );
}
