import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getDailyLogs, getFlares, getStreak } from '@/services/database';
import { generateWeeklyInsight } from '@/services/aiInsights';
import { useSubscription } from '@/hooks/useSubscription';
import { DailyLog, Flare, Mood, UserProfile } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendChartProps {
  series: Array<{ data: number[]; color: string; label: string }>;
  labels: string[];
  height: number;
  minVal?: number;
  maxVal?: number;
  width: number;
}

// ─── TrendChart component ─────────────────────────────────────────────────────

function TrendChart({
  series,
  labels,
  height,
  minVal = 0,
  maxVal = 10,
  width,
}: TrendChartProps) {
  const paddingLeft = 28;
  const paddingRight = 8;
  const paddingTop = 10;
  const paddingBottom = 24;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const pointCount = labels.length;

  function xForIndex(i: number): number {
    if (pointCount <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (i / (pointCount - 1)) * chartWidth;
  }

  function yForValue(value: number): number {
    const clamped = Math.min(maxVal, Math.max(minVal, value));
    const ratio = (clamped - minVal) / (maxVal - minVal);
    return paddingTop + chartHeight - ratio * chartHeight;
  }

  function buildPoints(data: number[]): string {
    return data
      .map((v, i) => `${xForIndex(i).toFixed(1)},${yForValue(v).toFixed(1)}`)
      .join(' ');
  }

  const ySteps = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <Svg width={width} height={height}>
      {ySteps.map((val) => {
        const y = yForValue(val);
        return (
          <React.Fragment key={`y-${val}`}>
            <Line
              x1={paddingLeft}
              y1={y}
              x2={paddingLeft + chartWidth}
              y2={y}
              stroke="#E7E5E4"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <SvgText
              x={paddingLeft - 4}
              y={y + 4}
              fontSize={9}
              fill="#A8A29E"
              textAnchor="end"
            >
              {val % 1 === 0 ? val.toString() : val.toFixed(0)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {labels.map((label, i) => {
        if (i % 2 !== 0) return null;
        return (
          <SvgText
            key={`x-${i}`}
            x={xForIndex(i)}
            y={height - 4}
            fontSize={9}
            fill="#A8A29E"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}

      {series.map((s) => {
        if (s.data.length < 2) return null;
        return (
          <Polyline
            key={s.label}
            points={buildPoints(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}

      {series.map((s) => {
        if (s.data.length === 0) return null;
        const lastIdx = s.data.length - 1;
        return (
          <Circle
            key={`dot-${s.label}`}
            cx={xForIndex(lastIdx)}
            cy={yForValue(s.data[lastIdx])}
            r={4}
            fill={s.color}
          />
        );
      })}
    </Svg>
  );
}

// ─── AIInsightCard component ──────────────────────────────────────────────────

interface AIInsightCardProps {
  logs: DailyLog[];
  flares: Flare[];
  profile: UserProfile | null;
  isDark: boolean;
}

function AIInsightCard({ logs, flares, profile, isDark }: AIInsightCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  const cardBg = isDark ? Colors.surfaceDark : Colors.surface;
  const cardBorder = isDark ? Colors.borderDark : Colors.border;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimary;
  const textSecondary = isDark ? Colors.textSecondaryDark : Colors.textSecondary;

  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!user || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      // We need the profile — pull from context via hook not available here,
      // so we build a minimal profile shape from what we know
      // The profile is passed via the parent; here we call generateWeeklyInsight
      // with placeholder profile since we don't have it — the parent should pass it
      // For now, use logs/flares which are passed in
      const result = await generateWeeklyInsight({
        logs,
        flares,
        profile: profile ?? {
          user_id: user.id,
          age_range: null,
          diagnosis_years: null,
          severity: null,
          medications: [],
          pain_locations: [],
          pain_types: [],
          conditions: [],
          morning_stiffness: null,
          challenges: [],
          notification_time: '20:00',
          ai_context: '',
          onboarding_complete: true,
        },
      });
      setInsight(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('insights.ai_insight_error');
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [user, logs, flares, isGenerating, t]);

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      {/* Card header */}
      <View style={styles.aiCardHeader}>
        <View style={styles.aiTitleRow}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            {t('insights.ai_insight_card_title')}
          </Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>Premium</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={generate}
          disabled={isGenerating}
          activeOpacity={0.8}
          style={[styles.refreshBtn, { borderColor: Colors.primary, opacity: isGenerating ? 0.5 : 1 }]}
        >
          <Text style={styles.refreshBtnText}>{t('insights.ai_insight_refresh')}</Text>
        </TouchableOpacity>
      </View>

      {isGenerating ? (
        <View style={styles.generatingRow}>
          <ActivityIndicator color={Colors.primary} size="small" />
          <Text style={[styles.generatingText, { color: textSecondary }]}>
            {t('insights.ai_insight_generating')}
          </Text>
        </View>
      ) : error ? (
        <View>
          <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={generate} activeOpacity={0.8} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : insight ? (
        <Text style={[styles.insightText, { color: textPrimary }]}>{insight}</Text>
      ) : (
        <View>
          <Text style={[styles.teaserText, { color: textSecondary }]}>
            {t('insights.ai_insight_teaser')}
          </Text>
          <TouchableOpacity onPress={generate} activeOpacity={0.8} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>{t('insights.ai_insight_refresh')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat CTA */}
      <TouchableOpacity
        onPress={() => router.push('/ai-chat')}
        activeOpacity={0.8}
        style={styles.chatCtaBtn}
      >
        <Text style={styles.chatCtaText}>{t('insights.chat_cta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TrialPromptCard ──────────────────────────────────────────────────────────

interface TrialPromptCardProps {
  isDark: boolean;
  onStartTrial: () => void;
}

function TrialPromptCard({ isDark, onStartTrial }: TrialPromptCardProps) {
  const { t } = useTranslation();
  const cardBg = isDark ? Colors.surfaceDark : Colors.surface;
  const cardBorder = isDark ? Colors.borderDark : Colors.border;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimary;
  const textSecondary = isDark ? Colors.textSecondaryDark : Colors.textSecondary;

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: Colors.primary }]}>
      <View style={styles.aiTitleRow}>
        <Text style={[styles.cardTitle, { color: textPrimary }]}>
          {t('insights.trial_prompt_title')}
        </Text>
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>Premium</Text>
        </View>
      </View>
      <Text style={[styles.teaserText, { color: textSecondary }]}>
        {t('insights.trial_prompt_body')}
      </Text>
      <TouchableOpacity onPress={onStartTrial} activeOpacity={0.8} style={styles.ctaBtn}>
        <Text style={styles.ctaBtnText}>{t('insights.trial_prompt_cta')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function moodToScore(mood: Mood | null): number {
  switch (mood) {
    case 'great': return 5;
    case 'good': return 4;
    case 'okay': return 3;
    case 'low': return 2;
    case 'very_low': return 1;
    default: return 0;
  }
}

function dayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T12:00:00');
  return days[d.getDay()];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function flareDays(flare: Flare): number {
  const start = new Date(flare.start_date);
  const end = flare.end_date ? new Date(flare.end_date) : new Date();
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Period = 7 | 30 | 90 | 180;

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isSubscribed, isLoading: subLoading, purchase } = useSubscription();

  const [period, setPeriod] = useState<Period>(30);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]); // 28-day for AI
  const [flares, setFlares] = useState<Flare[]>([]);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [chartWidth, setChartWidth] = useState(300);

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [periodLogs, logs30, allFlares, currentStreak] = await Promise.all([
        getDailyLogs(user.id, period),
        getDailyLogs(user.id, 30),
        getFlares(user.id),
        getStreak(user.id),
      ]);
      setLogs(periodLogs);
      setAllLogs(logs30);

      const since = new Date();
      since.setDate(since.getDate() - period);
      const sinceStr = since.toISOString().split('T')[0];
      setFlares(allFlares.filter((f) => f.start_date >= sinceStr));
      setStreak(currentStreak);
    } catch (err) {
      console.error('InsightsScreen load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    load();
  }, [load]);

  function onCardLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setChartWidth(w);
  }

  // Determine if user has tracked >= 14 days (for trial prompt)
  const hasEnoughDataForTrialPrompt = allLogs.length >= 14;

  const painData = logs.map((l) => l.pain_score);
  const fatigueData = logs.map((l) => l.fatigue_score);
  const moodData = logs.map((l) => moodToScore(l.mood)).filter((v) => v > 0);
  const moodLabels = logs
    .filter((l) => l.mood !== null)
    .map((l) => dayLabel(l.date));
  const chartLabels = logs.map((l) => dayLabel(l.date));

  const avgPain =
    painData.length > 0
      ? (painData.reduce((a, b) => a + b, 0) / painData.length).toFixed(1)
      : null;

  const avgFatigue =
    fatigueData.length > 0
      ? (fatigueData.reduce((a, b) => a + b, 0) / fatigueData.length).toFixed(1)
      : null;

  let bestDay: string | null = null;
  if (logs.length >= 7) {
    const dayMap: Record<string, number[]> = {};
    logs.forEach((l) => {
      const d = dayLabel(l.date);
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(l.pain_score);
    });
    let minAvg = Infinity;
    for (const [day, scores] of Object.entries(dayMap)) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < minAvg) {
        minAvg = avg;
        bestDay = day;
      }
    }
  }

  const bg = isDark ? Colors.backgroundDark : Colors.background;
  const cardBg = isDark ? Colors.surfaceDark : Colors.surface;
  const cardBorder = isDark ? Colors.borderDark : Colors.border;
  const textPrimary = isDark ? Colors.textPrimaryDark : Colors.textPrimary;
  const textSecondary = isDark ? Colors.textSecondaryDark : Colors.textSecondary;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, { color: textPrimary }]}>
          {t('insights.title')}
        </Text>

        {/* ── AI Insight section — above period selector ── */}
        {!subLoading && (
          isSubscribed ? (
            <AIInsightCard logs={allLogs} flares={flares} profile={profile} isDark={isDark} />
          ) : hasEnoughDataForTrialPrompt ? (
            <TrialPromptCard
              isDark={isDark}
              onStartTrial={purchase}
            />
          ) : null
        )}

        {/* Period selector */}
        <View style={styles.periodRow}>
          {([7, 30, 90, 180] as Period[]).map((p) => {
            const label = p === 7 ? '7d' : p === 30 ? '1m' : p === 90 ? '3m' : '6m';
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                activeOpacity={0.8}
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor: period === p ? Colors.primary : cardBg,
                    borderColor: period === p ? Colors.primary : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    { color: period === p ? '#FFFFFF' : textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              {t('common.loading')}
            </Text>
          </View>
        ) : logs.length === 0 ? (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.emptyText, { color: textSecondary }]}>
              {t('insights.no_data')}
            </Text>
          </View>
        ) : (
          <>
            {/* Pain & Fatigue chart */}
            <View
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onLayout={onCardLayout}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                {t('insights.pain_fatigue')}
              </Text>
              <TrendChart
                series={[
                  { data: painData, color: Colors.error, label: t('insights.legend_pain') },
                  { data: fatigueData, color: Colors.warning, label: t('insights.legend_fatigue') },
                ]}
                labels={chartLabels}
                height={120}
                minVal={0}
                maxVal={10}
                width={Math.max(10, chartWidth - Spacing.md * 2)}
              />
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                  <Text style={[styles.legendText, { color: textSecondary }]}>
                    {t('insights.legend_pain')}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                  <Text style={[styles.legendText, { color: textSecondary }]}>
                    {t('insights.legend_fatigue')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Mood chart */}
            {moodData.length > 0 && (
              <View
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  {t('insights.mood_trend')}
                </Text>
                <TrendChart
                  series={[
                    { data: moodData, color: Colors.success, label: 'mood' },
                  ]}
                  labels={moodLabels}
                  height={80}
                  minVal={1}
                  maxVal={5}
                  width={Math.max(10, chartWidth - Spacing.md * 2)}
                />
                <View style={styles.moodYLabels}>
                  <Text style={[styles.moodYLabel, { color: textSecondary }]}>very low</Text>
                  <Text style={[styles.moodYLabel, { color: textSecondary }]}>great</Text>
                </View>
              </View>
            )}

            {/* Flare history */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                {t('flares.flare_history')}
              </Text>
              {flares.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary }]}>
                  {t('insights.no_flares_great')}
                </Text>
              ) : (
                flares.map((flare) => (
                  <View
                    key={flare.id}
                    style={[
                      styles.flareRow,
                      { borderBottomColor: cardBorder },
                    ]}
                  >
                    <View style={styles.flareInfo}>
                      <Text style={[styles.flareDate, { color: textPrimary }]}>
                        {formatDate(flare.start_date)}
                        {flare.end_date
                          ? ` → ${formatDate(flare.end_date)}`
                          : ` (${t('flares.ongoing')})`}
                      </Text>
                      <Text style={[styles.flareDays, { color: textSecondary }]}>
                        {flareDays(flare)}{t('insights.days_suffix')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor:
                            flare.severity === 'severe'
                              ? Colors.error
                              : flare.severity === 'moderate'
                              ? Colors.warning
                              : Colors.success,
                        },
                      ]}
                    >
                      <Text style={styles.severityText}>
                        {flare.severity}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Patterns card */}
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                {t('insights.patterns')}
              </Text>
              <View style={styles.statsGrid}>
                <StatRow
                  label={t('insights.avg_pain')}
                  value={avgPain !== null ? `${avgPain}/10` : '—'}
                  isDark={isDark}
                />
                <StatRow
                  label={t('insights.avg_fatigue')}
                  value={avgFatigue !== null ? `${avgFatigue}/10` : '—'}
                  isDark={isDark}
                />
                {bestDay && (
                  <StatRow
                    label={t('insights.best_day')}
                    value={bestDay}
                    isDark={isDark}
                  />
                )}
                <StatRow
                  label={t('insights.log_streak')}
                  value={`${streak}${t('insights.days_suffix')}`}
                  isDark={isDark}
                />
              </View>
            </View>
          </>
        )}

        {/* Chat CTA for non-subscribers — shown below when not subscribed */}
        {!subLoading && !isSubscribed && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiTitleRow}>
                <Text style={[styles.cardTitle, { color: textPrimary }]}>
                  {t('insights.ai_insight_title')}
                </Text>
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.teaserText, { color: textSecondary }]}>
              {t('insights.ai_insight_teaser')}
            </Text>
            <TouchableOpacity
              style={styles.ctaBtn}
              activeOpacity={0.8}
              onPress={purchase}
            >
              <Text style={styles.ctaBtnText}>{t('insights.unlock_ai_cta')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat button for subscribers */}
        {!subLoading && isSubscribed && (
          <TouchableOpacity
            onPress={() => router.push('/ai-chat')}
            activeOpacity={0.8}
            style={[styles.chatNavBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Text style={[styles.chatNavText, { color: Colors.primary }]}>
              {t('insights.chat_cta')}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: isDark ? Colors.textSecondaryDark : Colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: isDark ? Colors.textPrimaryDark : Colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  periodBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  periodBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
  },
  moodYLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  moodYLabel: {
    fontSize: FontSize.xs,
  },
  flareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flareInfo: {
    flex: 1,
  },
  flareDate: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  flareDays: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  severityText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  statsGrid: {
    gap: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
  },
  statValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  // AI card styles
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  premiumBadgeText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  refreshBtn: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  refreshBtnText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  generatingText: {
    fontSize: FontSize.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  retryBtnText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    fontWeight: '600',
  },
  insightText: {
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  teaserText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  chatCtaBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  chatCtaText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  chatNavBtn: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  chatNavText: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
});
