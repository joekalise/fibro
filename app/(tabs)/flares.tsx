import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  useColorScheme,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useFlares } from '@/hooks/useFlares';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { FlareSeverity, PainLocation, Flare } from '@/types';

// ─── Severity badge ──────────────────────────────────────────────────────────

const SEVERITY_COLOR: Record<FlareSeverity, string> = {
  mild: Colors.success,
  moderate: Colors.warning,
  severe: Colors.error,
};

function SeverityBadge({ severity, isDark }: { severity: FlareSeverity; isDark: boolean }) {
  const { t } = useTranslation();
  const color = SEVERITY_COLOR[severity];
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>
        {t(`flares.severity_${severity}`)}
      </Text>
    </View>
  );
}

// ─── Format helpers ──────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysBetween(start: string, end: string | null): number {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  return Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

// ─── Pain location labels ────────────────────────────────────────────────────

const PAIN_LOCATION_KEYS: Record<PainLocation, string> = {
  lower_back: 'onboarding.pain_locations.lower_back',
  upper_back: 'onboarding.pain_locations.upper_back',
  hips: 'onboarding.pain_locations.hips',
  knees: 'onboarding.pain_locations.knees',
  shoulders: 'onboarding.pain_locations.shoulders',
  neck: 'onboarding.pain_locations.neck',
  chest: 'onboarding.pain_locations.chest',
  jaw: 'onboarding.pain_locations.jaw',
};

const ALL_PAIN_LOCATIONS: PainLocation[] = [
  'lower_back',
  'upper_back',
  'hips',
  'knees',
  'shoulders',
  'neck',
  'chest',
  'jaw',
];

// ─── Flare history item ──────────────────────────────────────────────────────

function FlareHistoryItem({ flare, isDark }: { flare: Flare; isDark: boolean }) {
  const { t } = useTranslation();
  const days = daysBetween(flare.start_date, flare.end_date);
  const areaLabels = flare.areas_affected.map((a) => t(PAIN_LOCATION_KEYS[a])).join(', ');

  return (
    <View style={[styles.historyItem, isDark && styles.historyItemDark]}>
      <View style={styles.historyItemHeader}>
        <Text style={[styles.historyDateRange, isDark && styles.textPrimaryDark]}>
          {formatDate(flare.start_date)}
          {flare.end_date ? ` – ${formatDate(flare.end_date)}` : ''}
        </Text>
        <SeverityBadge severity={flare.severity} isDark={isDark} />
      </View>
      <Text style={[styles.historyDuration, isDark && styles.textSecDark]}>
        {flare.end_date
          ? t('flares.duration_days', { days })
          : t('flares.duration_ongoing')}
      </Text>
      {areaLabels.length > 0 && (
        <Text style={[styles.historyAreas, isDark && styles.textSecDark]} numberOfLines={2}>
          {areaLabels}
        </Text>
      )}
    </View>
  );
}

// ─── Start Flare Modal ────────────────────────────────────────────────────────

interface StartFlareModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (severity: FlareSeverity, areas: PainLocation[], notes: string) => Promise<void>;
  isDark: boolean;
}

function StartFlareModal({ visible, onClose, onConfirm, isDark }: StartFlareModalProps) {
  const { t } = useTranslation();
  const [severity, setSeverity] = useState<FlareSeverity>('moderate');
  const [areas, setAreas] = useState<PainLocation[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleArea = (area: PainLocation) => {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm(severity, areas, notes);
      // Reset state for next time
      setSeverity('moderate');
      setAreas([]);
      setNotes('');
      onClose();
    } catch {
      Alert.alert(t('errors.save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const SEVERITIES: FlareSeverity[] = ['mild', 'moderate', 'severe'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, isDark && styles.textPrimaryDark]}>
            {t('flares.log_flare_start')}
          </Text>

          {/* Severity */}
          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>
            {t('flares.flare_severity')}
          </Text>
          <View style={styles.chipRow}>
            {SEVERITIES.map((sev) => {
              const selected = severity === sev;
              const color = SEVERITY_COLOR[sev];
              return (
                <TouchableOpacity
                  key={sev}
                  onPress={() => setSeverity(sev)}
                  style={[
                    styles.chip,
                    isDark && styles.chipDark,
                    selected && { backgroundColor: color + '22', borderColor: color },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isDark && styles.textSecDark,
                      selected && { color, fontWeight: '700' },
                    ]}
                  >
                    {t(`flares.severity_${sev}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Areas affected */}
          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>
            {t('flares.areas_affected')}
          </Text>
          <View style={styles.chipRow}>
            {ALL_PAIN_LOCATIONS.map((area) => {
              const selected = areas.includes(area);
              return (
                <TouchableOpacity
                  key={area}
                  onPress={() => toggleArea(area)}
                  style={[
                    styles.chip,
                    isDark && styles.chipDark,
                    selected && styles.chipSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isDark && styles.textSecDark,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {t(PAIN_LOCATION_KEYS[area])}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes */}
          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>
            {t('flares.notes')}
          </Text>
          <TextInput
            style={[styles.notesInput, isDark && styles.notesInputDark]}
            placeholder={t('flares.notes_placeholder')}
            placeholderTextColor={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Actions */}
          <Button
            label={t('flares.log_flare_start')}
            onPress={handleConfirm}
            isLoading={isSaving}
            style={styles.modalConfirmButton}
          />
          <Button
            label={t('common.cancel')}
            onPress={onClose}
            variant="ghost"
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FlaresScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { flares, activeFlare, isLoading, error, startFlare, endCurrentFlare, refresh } = useFlares();
  const [modalVisible, setModalVisible] = useState(false);

  const endedFlares = flares.filter((f) => f.end_date !== null);

  const handleEndFlare = () => {
    Alert.alert(
      t('flares.end_flare'),
      t('flares.confirm_end'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await endCurrentFlare();
            } catch {
              Alert.alert(t('errors.save_failed'));
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.screen, isDark && styles.screenDark]}>
        <LoadingSpinner fullScreen message={t('common.loading')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, isDark && styles.screenDark]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, isDark && styles.textPrimaryDark]}>
          {t('flares.title')}
        </Text>

        {error && (
          <ErrorMessage message={error} onRetry={refresh} retryLabel={t('common.retry')} />
        )}

        {/* Active flare section */}
        {activeFlare ? (
          <View style={[styles.activeFlareCard, isDark && styles.activeFlareCardDark]}>
            <View style={styles.activeFlareTitleRow}>
              <View style={styles.activeFlareIndicator} />
              <Text style={styles.activeFlareTitle}>{t('flares.active_flare')}</Text>
              <SeverityBadge severity={activeFlare.severity} isDark={isDark} />
            </View>
            <Text style={[styles.activeFlareDate, isDark && styles.textSecDark]}>
              {t('flares.started')}: {formatDate(activeFlare.start_date)}
            </Text>
            <Text style={[styles.activeFlareDuration, isDark && styles.textSecDark]}>
              {t('flares.duration_ongoing')} · {daysBetween(activeFlare.start_date, null)} {t('flares.duration_days', { days: daysBetween(activeFlare.start_date, null) }).replace(/\d+ /, '')}
            </Text>
            {activeFlare.areas_affected.length > 0 && (
              <Text style={[styles.activeFlareAreas, isDark && styles.textSecDark]}>
                {activeFlare.areas_affected.map((a) => t(PAIN_LOCATION_KEYS[a])).join(', ')}
              </Text>
            )}
            <Button
              label={t('flares.end_flare')}
              onPress={handleEndFlare}
              variant="outline"
              textStyle={{ color: Colors.error }}
              style={styles.endFlareButton}
            />
          </View>
        ) : (
          <View style={[styles.noFlareCard, isDark && styles.noFlareCardDark]}>
            <View style={styles.noFlareTitleRow}>
              <View style={styles.greenDot} />
              <Text style={[styles.noFlareText, isDark && styles.textPrimaryDark]}>
                {t('flares.no_active_flare')}
              </Text>
            </View>
            <Button
              label={t('flares.log_flare_cta')}
              onPress={() => setModalVisible(true)}
              style={styles.logFlareButton}
            />
          </View>
        )}

        {/* If there's an active flare, show log button below */}
        {activeFlare && (
          <Button
            label={t('flares.log_flare_cta')}
            onPress={() => setModalVisible(true)}
            variant="outline"
          />
        )}

        {/* Flare history */}
        <Text style={[styles.sectionTitle, isDark && styles.textPrimaryDark]}>
          {t('flares.flare_history')}
        </Text>

        {endedFlares.length === 0 ? (
          <View style={[styles.emptyCard, isDark && styles.emptyCardDark]}>
            <Text style={[styles.emptyText, isDark && styles.textSecDark]}>
              {t('flares.no_flares')}
            </Text>
          </View>
        ) : (
          endedFlares.map((flare) => (
            <FlareHistoryItem key={flare.id ?? flare.start_date} flare={flare} isDark={isDark} />
          ))
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <StartFlareModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={startFlare}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenDark: {
    backgroundColor: Colors.backgroundDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  textPrimaryDark: {
    color: Colors.textPrimaryDark,
  },
  textSecDark: {
    color: Colors.textSecondaryDark,
  },

  // Active flare card
  activeFlareCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    gap: Spacing.sm,
  },
  activeFlareCardDark: {
    backgroundColor: '#431407',
    borderColor: Colors.primaryDark,
  },
  activeFlareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  activeFlareIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  activeFlareTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.primary,
    flex: 1,
  },
  activeFlareDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  activeFlareDuration: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  activeFlareAreas: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  endFlareButton: {
    marginTop: Spacing.xs,
    borderColor: Colors.error,
  },

  // No active flare card
  noFlareCard: {
    backgroundColor: Colors.success + '18',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
    gap: Spacing.md,
  },
  noFlareCardDark: {
    backgroundColor: '#052E16',
    borderColor: Colors.success,
  },
  noFlareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  noFlareText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logFlareButton: {
    marginTop: Spacing.xs,
  },

  // Section title
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },

  // History items
  historyItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  historyItemDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyDateRange: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  historyDuration: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyAreas: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // Severity badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyCardDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Chip styles (used in modal)
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipDark: {
    borderColor: Colors.borderDark,
    backgroundColor: Colors.backgroundDark,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  modalSheetDark: {
    backgroundColor: Colors.surfaceDark,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalSectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  notesInput: {
    minHeight: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  notesInputDark: {
    borderColor: Colors.borderDark,
    backgroundColor: Colors.backgroundDark,
    color: Colors.textPrimaryDark,
  },
  modalConfirmButton: {
    marginTop: Spacing.xs,
  },

  bottomPad: {
    height: Spacing.xl,
  },
});
