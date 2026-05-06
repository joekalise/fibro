import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/colors';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useDailyLog } from '@/hooks/useDailyLog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Button } from '@/components/common/Button';
import { Mood, MorningStiffness } from '@/types';

// ─── Number Selector (0-10) ──────────────────────────────────────────────────

interface NumberSelectorProps {
  value: number;
  onChange: (n: number) => void;
  isDark: boolean;
}

function NumberSelector({ value, onChange, isDark }: NumberSelectorProps) {
  return (
    <View style={styles.numberRow}>
      {Array.from({ length: 11 }, (_, i) => i).map((n) => {
        const selected = n === value;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.numberCircle,
              isDark && styles.numberCircleDark,
              selected && styles.numberCircleSelected,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.numberCircleText,
                isDark && styles.numberCircleTextDark,
                selected && styles.numberCircleTextSelected,
              ]}
            >
              {n}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Stiffness Chips ──────────────────────────────────────────────────────────

const STIFFNESS_OPTIONS: { value: MorningStiffness; labelKey: string }[] = [
  { value: 'under_30', labelKey: 'onboarding.morning_stiffness.under_30' },
  { value: '30_60', labelKey: 'onboarding.morning_stiffness.30_60' },
  { value: '1_2_hours', labelKey: 'onboarding.morning_stiffness.1_2_hours' },
  { value: 'over_2_hours', labelKey: 'onboarding.morning_stiffness.over_2_hours' },
];

interface ChipRowProps {
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (v: string) => void;
  isDark: boolean;
}

function ChipRow({ options, selected, onSelect, isDark }: ChipRowProps) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              isDark && styles.chipDark,
              isSelected && styles.chipSelected,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isDark && styles.chipTextDark,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Mood Selector ────────────────────────────────────────────────────────────

const MOOD_OPTIONS: { value: Mood; emoji: string; labelKey: string; color: string }[] = [
  { value: 'great', emoji: '😊', labelKey: 'tracker.mood_great', color: Colors.moodGreat },
  { value: 'good', emoji: '🙂', labelKey: 'tracker.mood_good', color: Colors.moodGood },
  { value: 'okay', emoji: '😐', labelKey: 'tracker.mood_okay', color: Colors.moodOkay },
  { value: 'low', emoji: '😔', labelKey: 'tracker.mood_low', color: Colors.moodLow },
  { value: 'very_low', emoji: '😞', labelKey: 'tracker.mood_very_low', color: Colors.moodVeryLow },
];

// ─── Today's Log Summary ──────────────────────────────────────────────────────

function LogSummary({
  painScore,
  fatigueScore,
  mood,
  isDark,
  t,
}: {
  painScore: number;
  fatigueScore: number;
  mood: Mood | null;
  isDark: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === mood);
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryItem, isDark && styles.summaryItemDark]}>
        <Text style={[styles.summaryLabel, isDark && styles.textSecDark]}>{t('tracker.pain_score')}</Text>
        <Text style={[styles.summaryValue, isDark && styles.textPrimaryDark]}>{t('tracker.pain_score_value', { score: painScore })}</Text>
      </View>
      <View style={[styles.summaryItem, isDark && styles.summaryItemDark]}>
        <Text style={[styles.summaryLabel, isDark && styles.textSecDark]}>{t('tracker.fatigue_score')}</Text>
        <Text style={[styles.summaryValue, isDark && styles.textPrimaryDark]}>{t('tracker.pain_score_value', { score: fatigueScore })}</Text>
      </View>
      {moodOption && (
        <View style={[styles.summaryItem, isDark && styles.summaryItemDark]}>
          <Text style={[styles.summaryLabel, isDark && styles.textSecDark]}>{t('tracker.mood')}</Text>
          <Text style={[styles.summaryValue, { color: moodOption.color }]}>{moodOption.emoji} {t(moodOption.labelKey)}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TrackScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { todayLog, todayLogged, streak, isLoading, error, saveLog, refresh } = useDailyLog();

  const [editing, setEditing] = useState(false);
  const [painScore, setPainScore] = useState(todayLog?.pain_score ?? 0);
  const [fatigueScore, setFatigueScore] = useState(todayLog?.fatigue_score ?? 0);
  const [stiffness, setStiffness] = useState<MorningStiffness | null>(todayLog?.stiffness_duration ?? null);
  const [mood, setMood] = useState<Mood | null>(todayLog?.mood ?? null);
  const [medsTaken, setMedsTaken] = useState<'yes' | 'no' | 'partial'>(todayLog?.medications_taken ?? 'yes');
  const [notes, setNotes] = useState(todayLog?.notes ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const showForm = !todayLogged || editing;

  // Sync form with loaded log when it arrives
  React.useEffect(() => {
    if (todayLog) {
      setPainScore(todayLog.pain_score);
      setFatigueScore(todayLog.fatigue_score);
      setStiffness(todayLog.stiffness_duration);
      setMood(todayLog.mood);
      setMedsTaken(todayLog.medications_taken);
      setNotes(todayLog.notes);
    }
  }, [todayLog]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaved(false);
    try {
      await saveLog({
        pain_score: painScore,
        fatigue_score: fatigueScore,
        stiffness_duration: stiffness,
        mood,
        medications_taken: medsTaken,
        notes,
      });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      Alert.alert(t('errors.save_failed'));
    } finally {
      setIsSaving(false);
    }
  }, [saveLog, painScore, fatigueScore, stiffness, mood, medsTaken, notes, t]);

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const stiffnessOptions = STIFFNESS_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const medOptions = [
    { value: 'yes', label: t('tracker.medications_yes') },
    { value: 'partial', label: t('tracker.medications_partial') },
    { value: 'no', label: t('tracker.medications_no') },
  ];

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textPrimaryDark]}>
            {t('tracker.title')}
          </Text>
          <Text style={[styles.dateLabel, isDark && styles.textSecDark]}>
            {todayLabel}
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={refresh} retryLabel={t('common.retry')} />
        )}

        {/* Already logged banner */}
        {todayLogged && !editing && (
          <View style={[styles.loggedCard, isDark && styles.loggedCardDark]}>
            <View style={styles.loggedCardHeader}>
              <Text style={styles.loggedTick}>✓</Text>
              <View style={styles.loggedCardTextGroup}>
                <Text style={[styles.loggedTitle, isDark && styles.textPrimaryDark]}>
                  {t('tracker.already_logged_title')}
                </Text>
                <Text style={[styles.loggedSubtitle, isDark && styles.textSecDark]}>
                  {t('tracker.already_logged_subtitle')}
                </Text>
              </View>
              {streak > 0 && (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakBadgeText}>🔥 {streak}</Text>
                </View>
              )}
            </View>

            {todayLog && (
              <LogSummary
                painScore={todayLog.pain_score}
                fatigueScore={todayLog.fatigue_score}
                mood={todayLog.mood}
                isDark={isDark}
                t={t}
              />
            )}

            <Button
              label={t('tracker.edit_today')}
              onPress={() => setEditing(true)}
              variant="outline"
              style={styles.editButton}
            />
          </View>
        )}

        {/* Success message after save in edit mode */}
        {saved && !editing && (
          <View style={[styles.successCard, isDark && styles.successCardDark]}>
            <Text style={styles.successText}>{t('tracker.saved_success')}</Text>
          </View>
        )}

        {/* Check-in form */}
        {showForm && (
          <>
            {/* Pain level */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                  {t('tracker.pain_score')}
                </Text>
                <Text style={styles.sectionValue}>
                  {t('tracker.pain_score_value', { score: painScore })}
                </Text>
              </View>
              <NumberSelector value={painScore} onChange={setPainScore} isDark={isDark} />
              <Text style={[styles.hint, isDark && styles.textSecDark]}>
                {t('tracker.pain_score_hint')}
              </Text>
            </View>

            {/* Fatigue level */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                  {t('tracker.fatigue_score')}
                </Text>
                <Text style={styles.sectionValue}>
                  {t('tracker.pain_score_value', { score: fatigueScore })}
                </Text>
              </View>
              <NumberSelector value={fatigueScore} onChange={setFatigueScore} isDark={isDark} />
              <Text style={[styles.hint, isDark && styles.textSecDark]}>
                {t('tracker.fatigue_score_hint')}
              </Text>
            </View>

            {/* Morning stiffness */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                {t('tracker.stiffness_duration')}
              </Text>
              <ChipRow
                options={stiffnessOptions}
                selected={stiffness}
                onSelect={(v) => setStiffness(v as MorningStiffness)}
                isDark={isDark}
              />
            </View>

            {/* Mood */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                {t('tracker.mood')}
              </Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((opt) => {
                  const selected = mood === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setMood(opt.value)}
                      style={[
                        styles.moodButton,
                        isDark && styles.moodButtonDark,
                        selected && { borderColor: opt.color, backgroundColor: opt.color + '22' },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                      <Text
                        style={[
                          styles.moodLabel,
                          isDark && styles.textSecDark,
                          selected && { color: opt.color, fontWeight: '700' },
                        ]}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Medications taken */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                {t('tracker.medications_taken')}
              </Text>
              <ChipRow
                options={medOptions}
                selected={medsTaken}
                onSelect={(v) => setMedsTaken(v as 'yes' | 'no' | 'partial')}
                isDark={isDark}
              />
            </View>

            {/* Notes */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionLabel, isDark && styles.textPrimaryDark]}>
                {t('tracker.notes')}
              </Text>
              <TextInput
                style={[styles.notesInput, isDark && styles.notesInputDark]}
                placeholder={t('tracker.notes_placeholder')}
                placeholderTextColor={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
                value={notes}
                onChangeText={(v) => setNotes(v.slice(0, 500))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Save button */}
            <Button
              label={t('tracker.save')}
              onPress={handleSave}
              isLoading={isSaving}
              style={styles.saveButton}
            />
          </>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
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
  header: {
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  textPrimaryDark: {
    color: Colors.textPrimaryDark,
  },
  textSecDark: {
    color: Colors.textSecondaryDark,
  },

  // Already logged card
  loggedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  loggedCardDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  loggedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loggedTick: {
    fontSize: FontSize.xl,
    color: Colors.success,
    fontWeight: '700',
  },
  loggedCardTextGroup: {
    flex: 1,
  },
  loggedTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loggedSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  streakBadgeText: {
    color: '#FFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  summaryItemDark: {
    backgroundColor: '#3D3530',
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  editButton: {
    marginTop: Spacing.xs,
  },

  // Success card
  successCard: {
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successCardDark: {
    backgroundColor: '#052E16',
    borderColor: Colors.success,
  },
  successText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },

  // Form sections
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Number selector
  numberRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.xs,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  numberCircleDark: {
    borderColor: Colors.borderDark,
    backgroundColor: Colors.backgroundDark,
  },
  numberCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  numberCircleText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  numberCircleTextDark: {
    color: Colors.textPrimaryDark,
  },
  numberCircleTextSelected: {
    color: '#FFFFFF',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
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
  chipTextDark: {
    color: Colors.textPrimaryDark,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Mood
  moodRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: 2,
  },
  moodButtonDark: {
    borderColor: Colors.borderDark,
    backgroundColor: Colors.backgroundDark,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Notes
  notesInput: {
    minHeight: 96,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  notesInputDark: {
    borderColor: Colors.borderDark,
    backgroundColor: Colors.backgroundDark,
    color: Colors.textPrimaryDark,
  },

  saveButton: {
    marginTop: Spacing.xs,
  },
  bottomPad: {
    height: Spacing.xl,
  },
});
