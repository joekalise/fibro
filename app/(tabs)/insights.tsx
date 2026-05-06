import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Polyline, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import { FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getDailyLogs, getFlares, getStreak } from '@/services/database';
import { DailyLog, Flare, Mood } from '@/types';

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

  // Y-axis grid lines at 0, 5, 10 (or min, mid, max)
  const ySteps = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <Svg width={width} height={height}>
      {/* Y-axis grid lines + labels */}
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

      {/* X-axis labels — every 2 points */}
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

      {/* Data lines */}
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

      {/* Data dots — last point only */}
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

function moodLabel(score: number): string {
  if (score >= 4.5) return 'great';
  if (score >= 3.5) return 'good';
  if (score >= 2.5) return 'okay';
  if (score >= 1.5) return 'low';
  return 'very low';
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

type Period = 14 | 28;

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [period, setPeriod] = useState<Period>(28);
  const [logs, setLogs] = useState<DailyLog[]>([]);
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
      const [periodLogs, allFlares, currentStreak] = await Promise.all([
        getDailyLogs(user.id, period),
        getFlares(user.id),
        getStreak(user.id),
      ]);
      setLogs(periodLogs);

      // Filter flares to those that overlap with the current period
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

  // ── Computed values ──────────────────────────────────────────────────────

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

  // Best day of week — day with lowest average pain
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

  // ── Styles (dark-aware) ───────────────────────────────────────────────────

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

        {/* Period selector */}
        <View style={styles.periodRow}>
          {([14, 28] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              activeOpacity={0.8}
              style={[
                styles.periodBtn,
                {
                  backgroundColor:
                    period === p ? Colors.primary : cardBg,
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
                {p === 14 ? t('insights.two_weeks') : t('insights.four_weeks')}
              </Text>
            </TouchableOpacity>
          ))}
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
                width={chartWidth}
              />
              {/* Legend */}
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
                  width={chartWidth}
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

        {/* AI Insight card — shown to all */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.aiHeader}>
            <Text style={[styles.cardTitle, { color: textPrimary }]}>
              {t('insights.ai_insight_title')}
            </Text>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          </View>
          <Text style={[styles.teaserText, { color: textSecondary }]}>
            {t('insights.ai_insight_teaser')}
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Text style={styles.ctaBtnText}>{t('insights.unlock_ai_cta')}</Text>
          </TouchableOpacity>
        </View>
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
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
});
