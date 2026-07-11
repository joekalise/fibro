import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useFlares } from '@/hooks/useFlares';
import { useProfile } from '@/contexts/ProfileContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { ProfileButton } from '@/components/common/ProfileButton';
import { FlareSeverity, Flare } from '@/types';
import { logEvent, Events } from '@/services/analytics';

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

const FIBRO_LOCATIONS: { value: string; label: string }[] = [
  { value: 'widespread', label: 'Widespread' },
  { value: 'neck_shoulders', label: 'Neck / shoulders' },
  { value: 'upper_back', label: 'Upper back' },
  { value: 'lower_back', label: 'Lower back' },
  { value: 'hips', label: 'Hips' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'hands_feet', label: 'Hands / feet' },
  { value: 'chest', label: 'Chest' },
  { value: 'jaw', label: 'Jaw (TMJ)' },
  { value: 'other', label: 'Other' },
];

// ─── Edit Flare Modal ─────────────────────────────────────────────────────────

interface EditFlareModalProps {
  visible: boolean;
  flare: Flare | null;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Flare>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDark: boolean;
  locationOptions: { value: string; label: string }[];
}

function EditFlareModal({ visible, flare, onClose, onSave, onDelete, isDark, locationOptions }: EditFlareModalProps) {
  const { t } = useTranslation();
  const [severity, setSeverity] = useState<FlareSeverity>('moderate');
  const [areas, setAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (flare) {
      setSeverity(flare.severity);
      setAreas(flare.areas_affected);
      setNotes(flare.notes ?? '');
      setStartDate(flare.start_date);
      setEndDate(flare.end_date ?? '');
    }
  }, [flare]);

  const toggleArea = (area: string) => {
    setAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleSave = async () => {
    if (!flare?.id) return;
    setIsSaving(true);
    try {
      await onSave(flare.id, { severity, areas_affected: areas, notes, start_date: startDate, end_date: endDate || null });
      onClose();
    } catch {
      Alert.alert(t('errors.save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!flare?.id) return;
    Alert.alert('Delete flare', 'This will permanently remove this entry.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await onDelete(flare.id!); onClose(); }
          catch { Alert.alert(t('errors.save_failed')); }
        },
      },
    ]);
  };

  const SEVERITIES: FlareSeverity[] = ['mild', 'moderate', 'severe'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, isDark && styles.textPrimaryDark]}>Edit flare</Text>

          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>
            {t('flares.flare_severity')}
          </Text>
          <View style={styles.chipRow}>
            {SEVERITIES.map(sev => {
              const selected = severity === sev;
              const color = SEVERITY_COLOR[sev];
              return (
                <TouchableOpacity
                  key={sev}
                  onPress={() => setSeverity(sev)}
                  style={[styles.chip, isDark && styles.chipDark, selected && { backgroundColor: color + '22', borderColor: color }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isDark && styles.textSecDark, selected && { color, fontWeight: '700' }]}>
                    {t(`flares.severity_${sev}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>Location</Text>
          <View style={styles.chipRow}>
            {locationOptions.map(loc => {
              const selected = areas.includes(loc.value);
              return (
                <TouchableOpacity
                  key={loc.value}
                  onPress={() => toggleArea(loc.value)}
                  style={[styles.chip, isDark && styles.chipDark, selected && styles.chipSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isDark && styles.textSecDark, selected && styles.chipTextSelected]}>
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>Dates</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateInputLabel, isDark && styles.textSecDark]}>Start</Text>
              <TextInput
                style={[styles.dateInput, isDark && styles.notesInputDark]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dateInputLabel, isDark && styles.textSecDark]}>End (leave blank if ongoing)</Text>
              <TextInput
                style={[styles.dateInput, isDark && styles.notesInputDark]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

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

          <Button label={t('common.save_changes')} onPress={handleSave} isLoading={isSaving} style={styles.modalConfirmButton} />
          <Button
            label={t('common.delete_entry')}
            onPress={handleDelete}
            variant="ghost"
            textStyle={{ color: Colors.error }}
          />
          <Button label={t('common.cancel')} onPress={onClose} variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

// ─── Flare history item ──────────────────────────────────────────────────────

function FlareHistoryItem({ flare, isDark, onEdit }: { flare: Flare; isDark: boolean; onEdit: () => void }) {
  const { t } = useTranslation();
  const days = daysBetween(flare.start_date, flare.end_date);
  const areaLabels = flare.areas_affected.map(a => a.replace(/_/g, ' ')).join(', ');
  const severityColor = SEVERITY_COLOR[flare.severity];

  return (
    <View style={[styles.historyItem, isDark && styles.historyItemDark, { borderLeftColor: severityColor }]}>
      <View style={styles.historyItemHeader}>
        <Text style={[styles.historyDateRange, isDark && styles.textPrimaryDark]}>
          {formatDate(flare.start_date)}
          {flare.end_date ? ` – ${formatDate(flare.end_date)}` : ''}
        </Text>
        <View style={styles.historyItemActions}>
          <SeverityBadge severity={flare.severity} isDark={isDark} />
          <TouchableOpacity onPress={onEdit} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.historyEditLink, { color: Colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.historyDuration, isDark && styles.textPrimaryDark]}>
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
  onConfirm: (severity: FlareSeverity, areas: string[], notes: string) => Promise<void>;
  isDark: boolean;
  title: string;
  locationOptions: { value: string; label: string }[];
}

function StartFlareModal({ visible, onClose, onConfirm, isDark, title, locationOptions }: StartFlareModalProps) {
  const { t } = useTranslation();
  const [severity, setSeverity] = useState<FlareSeverity>('moderate');
  const [areas, setAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleArea = (area: string) => {
    setAreas((prev) => prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm(severity, areas, notes);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, isDark && styles.modalSheetDark]}>
          <View style={styles.modalHandle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.modalTitle, isDark && styles.textPrimaryDark]}>{title}</Text>

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
                    style={[styles.chip, isDark && styles.chipDark, selected && { backgroundColor: color + '22', borderColor: color }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isDark && styles.textSecDark, selected && { color, fontWeight: '700' }]}>
                      {t(`flares.severity_${sev}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.modalSectionLabel, isDark && styles.textPrimaryDark]}>
              Location (optional)
            </Text>
            <View style={styles.chipRow}>
              {locationOptions.map((loc) => {
                const selected = areas.includes(loc.value);
                return (
                  <TouchableOpacity
                    key={loc.value}
                    onPress={() => toggleArea(loc.value)}
                    style={[styles.chip, isDark && styles.chipDark, selected && styles.chipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isDark && styles.textSecDark, selected && styles.chipTextSelected]}>
                      {loc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
              returnKeyType="done"
              blurOnSubmit
            />

            <Button label={t('flares.log_flare_button')} onPress={handleConfirm} isLoading={isSaving} style={styles.modalConfirmButton} />
            <Button label={t('common.cancel')} onPress={onClose} variant="ghost" />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function FlaresScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { flares, activeFlare, isLoading, error, startFlare, endCurrentFlare, updateFlare, deleteFlare, refresh } = useFlares('widespread');
  const { profile } = useProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlare, setEditingFlare] = useState<Flare | null>(null);

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
        {/* Screen title */}
        <View style={styles.screenTitleRow}>
          <Text style={[styles.screenTitle, isDark && styles.textPrimaryDark]}>
            Flares
          </Text>
          <ProfileButton />
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={refresh} retryLabel={t('common.retry')} />
        )}

        {/* ── Fibromyalgia Flare card — status + history grouped ─── */}
        <View style={[styles.groupCard, isDark && styles.groupCardDark]}>
          <Text style={[styles.groupCardTitle, isDark && styles.textPrimaryDark]}>Fibromyalgia Flare</Text>

          {activeFlare ? (
            <View style={[styles.activeFlareInner, isDark && styles.activeFlareInnerDark]}>
              <View style={styles.activeFlareTitleRow}>
                <View style={styles.activeFlareIndicator} />
                <Text style={styles.activeFlareTitle}>{t('flares.active_flare')}</Text>
                <SeverityBadge severity={activeFlare.severity} isDark={isDark} />
              </View>
              <Text style={[styles.activeFlareDate, isDark && styles.textSecDark]}>
                {t('flares.started')}: {formatDate(activeFlare.start_date)}
              </Text>
              <Text style={[styles.activeFlareDuration, isDark && styles.textSecDark]}>
                {t('flares.duration_ongoing')} · {daysBetween(activeFlare.start_date, null)} days
              </Text>
              {activeFlare.areas_affected.length > 0 && (
                <Text style={[styles.activeFlareAreas, isDark && styles.textSecDark]}>
                  {activeFlare.areas_affected.map(a => a.replace(/_/g, ' ')).join(', ')}
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
            <>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={[styles.statusText, isDark && styles.textPrimaryDark]}>{t('flares.no_current_flare')}</Text>
              </View>
              <Button
                label={t('flares.log_a_flare')}
                onPress={() => setModalVisible(true)}
                variant="outline"
                style={styles.logFlareBtn}
              />
            </>
          )}

          <View style={[styles.innerDivider, isDark && styles.innerDividerDark]} />
          <Text style={[styles.historySubLabel, isDark && styles.textSecDark]}>{t('common.history')}</Text>

          {endedFlares.length === 0 ? (
            <Text style={[styles.emptyStateText, isDark && styles.textSecDark]}>{t('flares.no_past_flares')}</Text>
          ) : (
            endedFlares.map((flare) => (
              <FlareHistoryItem key={flare.id ?? flare.start_date} flare={flare} isDark={isDark} onEdit={() => setEditingFlare(flare)} />
            ))
          )}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <StartFlareModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={async (sev, areas, notes) => { await startFlare(sev, areas, notes); logEvent(Events.FLARE_LOGGED, { type: 'fibro' }).catch(() => {}); }}
        isDark={isDark}
        title={t('flares.log_as_title')}
        locationOptions={FIBRO_LOCATIONS}
      />
      <EditFlareModal
        visible={editingFlare !== null}
        flare={editingFlare}
        onClose={() => setEditingFlare(null)}
        onSave={async (id, updates) => { await updateFlare(id, updates); setEditingFlare(null); }}
        onDelete={async (id) => { await deleteFlare(id); setEditingFlare(null); }}
        isDark={isDark}
        locationOptions={FIBRO_LOCATIONS}
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
  textPrimaryDark: {
    color: Colors.textPrimaryDark,
  },
  textSecDark: {
    color: Colors.textSecondaryDark,
  },

  // Grouped section card — contains title + status + history
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  groupCardDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  groupCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  activeFlareInner: {
    backgroundColor: Colors.error + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '50',
    gap: Spacing.xs,
  },
  activeFlareInnerDark: {
    backgroundColor: '#450A0A',
    borderColor: Colors.error + '60',
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginTop: Spacing.xs,
  },
  innerDividerDark: {
    backgroundColor: Colors.borderDark,
  },
  historySubLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  // Active flare card — red theme
  activeFlareCard: {
    backgroundColor: Colors.error + '12',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.error + '50',
    gap: Spacing.sm,
  },
  activeFlareCardDark: {
    backgroundColor: '#450A0A',
    borderColor: Colors.error + '70',
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
    backgroundColor: Colors.error,
  },
  activeFlareTitle: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: Colors.error,
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

  screenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },

  // Status card — always shown, neutral when no flare
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  statusCardDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logFlareBtn: {
    alignSelf: 'flex-start',
  },

  // Section header row
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  sectionActionLink: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  emptyStateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    paddingVertical: Spacing.xs,
  },

  // History items — 4px left border in severity color
  historyItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
    paddingLeft: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
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
  historyItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  historyEditLink: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  historyDateRange: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  historyDuration: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historyAreas: {
    fontSize: FontSize.xs,
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
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dateInputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.textSecondary,
  },
  dateInput: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },

  bottomPad: {
    height: Spacing.xl,
  },
  uveitisWarningBanner: {
    backgroundColor: Colors.error + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '50',
    marginBottom: Spacing.sm,
  },
  uveitisWarningText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    fontWeight: '600',
    lineHeight: 18,
  },
});
