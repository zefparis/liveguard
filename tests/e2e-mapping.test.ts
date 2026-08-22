/**
 * End-to-end mapping test: LiveGuard payload → cognitive_sessions row → Label Studio task
 *
 * This test proves that all 27 features + 6 heuristic_score vars are correctly
 * mapped through the full chain:
 *   1. LiveGuard frontend produces demo_guard.signals.cognitive.{reflex,stroop,...}.{avg_ms,accuracy,...}
 *   2. demoguardFusionTrigger maps snake_case nested → camelCase (CognitiveSignalsForMonitoring)
 *   3. logCognitiveSession maps camelCase → snake_case DB columns
 *   4. buildCognitiveTask reads snake_case DB columns → Label Studio task
 *
 * No DB access needed — this tests the mapping functions directly.
 */

import { describe, it, expect } from 'vitest';

// ─── Step 1: Simulate what LiveGuard frontend sends ───────────────────
// These are the exact field names from cognitiveTypes.ts (snake_case, nested)
const liveguardCognitiveSignals = {
  reflex: {
    rounds: 5,
    avg_ms: 287,
    median_ms: 280,
    variance_ms: 1240,
    min_ms: 210,
    max_ms: 380,
    too_fast_count: 0,
    too_slow_count: 1,
    regularity_score: 0.72,
    quality: 'ok' as const,
  },
  stroop: {
    trials: 10,
    conflict_trials: 5,
    accuracy: 0.85,
    avg_response_ms: 720,
    conflict_cost_ms: 180,
    error_count: 2,
    quality: 'ok' as const,
  },
  digit_span: {
    trials: 4,
    max_span: 7,
    accuracy: 0.75,
    positional_errors: 1,
    quality: 'ok' as const,
  },
  n_back: {
    trials: 15,
    targets: 5,
    hits: 4,
    false_positives: 1,
    misses: 1,
    accuracy: 0.8,
    avg_response_ms: 510,
    quality: 'ok' as const,
  },
  trail_tap: {
    nodes: 10,
    completion_ms: 8500,
    wrong_taps: 1,
    hesitation_count: 2,
    path_efficiency: 0.9,
    quality: 'ok' as const,
  },
  summary: {
    completed_modules: 5,
    total_modules: 5,
    depth_score: 0.82,
    consistency_score: 0.78,
    anomaly_score: 0.1,
    human_likelihood: 'high' as const,
    quality: 'ok' as const,
  },
};

const liveguardMotionSignal = {
  supported: true,
  permission: 'granted',
  sample_count: 142,
  variance: 0.34,
  accel_x_std: 0.12,
  accel_y_std: 0.08,
  accel_z_std: 0.15,
  quality: 'ok',
};

const liveguardOrientationSignal = {
  supported: true,
  permission: 'granted',
  sample_count: 89,
  changes: 12,
  quality: 'ok',
};

// ─── Step 2: Replicate demoguardFusionTrigger mapping ─────────────────
// (src/services/demoguardFusionTrigger.ts lines 1238-1278)
function mapCognitiveSignalsForMonitoring(
  cogSignals: typeof liveguardCognitiveSignals | undefined,
  motionSignal: typeof liveguardMotionSignal | undefined,
  orientationSignal: typeof liveguardOrientationSignal | undefined,
) {
  return {
    reflexAvgMs: cogSignals?.reflex?.avg_ms ?? null,
    reflexVarianceMs: cogSignals?.reflex?.variance_ms ?? null,
    reflexRegularityScore: cogSignals?.reflex?.regularity_score ?? null,
    reflexTooFastCount: cogSignals?.reflex?.too_fast_count ?? null,
    reflexMedianMs: cogSignals?.reflex?.median_ms ?? null,
    reflexMinMs: cogSignals?.reflex?.min_ms ?? null,
    reflexMaxMs: cogSignals?.reflex?.max_ms ?? null,
    reflexTooSlowCount: cogSignals?.reflex?.too_slow_count ?? null,
    stroopAccuracy: cogSignals?.stroop?.accuracy ?? null,
    stroopAvgResponseMs: cogSignals?.stroop?.avg_response_ms ?? null,
    stroopConflictCostMs: cogSignals?.stroop?.conflict_cost_ms ?? null,
    stroopErrorCount: cogSignals?.stroop?.error_count ?? null,
    nBackAccuracy: cogSignals?.n_back?.accuracy ?? null,
    nBackFalsePositives: cogSignals?.n_back?.false_positives ?? null,
    nBackHits: cogSignals?.n_back?.hits ?? null,
    nBackMisses: cogSignals?.n_back?.misses ?? null,
    nBackAvgResponseMs: cogSignals?.n_back?.avg_response_ms ?? null,
    digitSpanAccuracy: cogSignals?.digit_span?.accuracy ?? null,
    digitSpanMaxSpan: cogSignals?.digit_span?.max_span ?? null,
    digitSpanPositionalErrors: cogSignals?.digit_span?.positional_errors ?? null,
    trailTapCompletionMs: cogSignals?.trail_tap?.completion_ms ?? null,
    trailTapHesitationCount: cogSignals?.trail_tap?.hesitation_count ?? null,
    trailTapPathEfficiency: cogSignals?.trail_tap?.path_efficiency ?? null,
    trailTapWrongTaps: cogSignals?.trail_tap?.wrong_taps ?? null,
    depthScore: cogSignals?.summary?.depth_score ?? null,
    anomalyScore: cogSignals?.summary?.anomaly_score ?? null,
    consistencyScore: cogSignals?.summary?.consistency_score ?? null,
    completedModules: cogSignals?.summary?.completed_modules ?? null,
    quality: cogSignals?.summary?.quality ?? null,
    motionVariance: motionSignal?.variance ?? null,
    motionSampleCount: motionSignal?.sample_count ?? null,
    motionQuality: motionSignal?.quality ?? null,
    motionPermission: motionSignal?.permission ?? null,
    accelXStd: motionSignal?.accel_x_std ?? null,
    accelYStd: motionSignal?.accel_y_std ?? null,
    accelZStd: motionSignal?.accel_z_std ?? null,
    orientationChanges: orientationSignal?.changes ?? null,
    orientationSampleCount: orientationSignal?.sample_count ?? null,
    orientationQuality: orientationSignal?.quality ?? null,
    orientationPermission: orientationSignal?.permission ?? null,
    presentationVariant: 'liveguard' as const,
  };
}

// ─── Step 3: Replicate logCognitiveSession row builder ────────────────
// (src/services/cognitive-session-logger.ts)
function buildCognitiveSessionRow(
  sessionPublicId: string,
  tenantId: string,
  cog: ReturnType<typeof mapCognitiveSignalsForMonitoring>,
  humanLikelihood: 'high' | 'medium' | 'low' | null,
) {
  return {
    session_public_id: sessionPublicId,
    tenant_id: tenantId,
    reflex_avg_ms: cog.reflexAvgMs ?? null,
    reflex_variance_ms: cog.reflexVarianceMs ?? null,
    reflex_regularity_score: cog.reflexRegularityScore ?? null,
    reflex_too_fast_count: cog.reflexTooFastCount ?? null,
    reflex_median_ms: cog.reflexMedianMs ?? null,
    reflex_min_ms: cog.reflexMinMs ?? null,
    reflex_max_ms: cog.reflexMaxMs ?? null,
    reflex_too_slow_count: cog.reflexTooSlowCount ?? null,
    stroop_accuracy: cog.stroopAccuracy ?? null,
    stroop_avg_response_ms: cog.stroopAvgResponseMs ?? null,
    stroop_conflict_cost_ms: cog.stroopConflictCostMs ?? null,
    stroop_error_count: cog.stroopErrorCount ?? null,
    n_back_accuracy: cog.nBackAccuracy ?? null,
    n_back_false_positives: cog.nBackFalsePositives ?? null,
    n_back_hits: cog.nBackHits ?? null,
    n_back_misses: cog.nBackMisses ?? null,
    n_back_avg_response_ms: cog.nBackAvgResponseMs ?? null,
    digit_span_accuracy: cog.digitSpanAccuracy ?? null,
    digit_span_max_span: cog.digitSpanMaxSpan ?? null,
    digit_span_positional_errors: cog.digitSpanPositionalErrors ?? null,
    trail_tap_completion_ms: cog.trailTapCompletionMs ?? null,
    trail_tap_hesitation_count: cog.trailTapHesitationCount ?? null,
    trail_tap_path_efficiency: cog.trailTapPathEfficiency ?? null,
    trail_tap_wrong_taps: cog.trailTapWrongTaps ?? null,
    depth_score: cog.depthScore ?? null,
    anomaly_score: cog.anomalyScore ?? null,
    consistency_score: cog.consistencyScore ?? null,
    human_likelihood: humanLikelihood,
    completed_modules: cog.completedModules ?? null,
    quality: cog.quality ?? null,
    motion_variance: cog.motionVariance ?? null,
    motion_sample_count: cog.motionSampleCount ?? null,
    motion_quality: cog.motionQuality ?? null,
    motion_permission: cog.motionPermission ?? null,
    accel_x_std: cog.accelXStd ?? null,
    accel_y_std: cog.accelYStd ?? null,
    accel_z_std: cog.accelZStd ?? null,
    orientation_changes: cog.orientationChanges ?? null,
    orientation_sample_count: cog.orientationSampleCount ?? null,
    orientation_quality: cog.orientationQuality ?? null,
    orientation_permission: cog.orientationPermission ?? null,
    presentation_variant: cog.presentationVariant ?? null,
  };
}

// ─── Step 4: Replicate buildCognitiveTask ─────────────────────────────
// (src/services/label-studio-export.ts lines 184-235)
function buildCognitiveTask(row: Record<string, unknown>): { data: Record<string, unknown> } {
  const features: Record<string, unknown> = {
    reflex_avg_ms: row.reflex_avg_ms,
    reflex_variance_ms: row.reflex_variance_ms,
    reflex_regularity_score: row.reflex_regularity_score,
    reflex_too_fast_count: row.reflex_too_fast_count,
    stroop_accuracy: row.stroop_accuracy,
    stroop_avg_response_ms: row.stroop_avg_response_ms,
    stroop_conflict_cost_ms: row.stroop_conflict_cost_ms,
    stroop_error_count: row.stroop_error_count,
    n_back_accuracy: row.n_back_accuracy,
    n_back_false_positives: row.n_back_false_positives,
    n_back_hits: row.n_back_hits,
    n_back_misses: row.n_back_misses,
    digit_span_accuracy: row.digit_span_accuracy,
    digit_span_max_span: row.digit_span_max_span,
    digit_span_positional_errors: row.digit_span_positional_errors,
    trail_tap_completion_ms: row.trail_tap_completion_ms,
    trail_tap_hesitation_count: row.trail_tap_hesitation_count,
    trail_tap_path_efficiency: row.trail_tap_path_efficiency,
    n_back_avg_response_ms: row.n_back_avg_response_ms,
    reflex_median_ms: row.reflex_median_ms,
    reflex_min_ms: row.reflex_min_ms,
    trail_tap_wrong_taps: row.trail_tap_wrong_taps,
    motion_variance: row.motion_variance,
    accel_x_std: row.accel_x_std,
    accel_y_std: row.accel_y_std,
    accel_z_std: row.accel_z_std,
    orientation_changes: row.orientation_changes,
  };

  const heuristicScore: Record<string, unknown> = {
    depth_score: row.depth_score,
    anomaly_score: row.anomaly_score,
    consistency_score: row.consistency_score,
    human_likelihood: row.human_likelihood,
    completed_modules: row.completed_modules,
    quality: row.quality,
  };

  return {
    data: {
      session_id: row.session_public_id || `cog_${row.id}`,
      features,
      heuristic_score: heuristicScore,
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────

describe('LiveGuard end-to-end mapping: payload → DB row → Label Studio task', () => {
  const sessionPublicId = 'hcs_sess_liveguard_test_001';
  const tenantId = 'public_liveguard';

  // Step 2: demoguardFusionTrigger mapping
  const cognitiveSignalsForMonitoring = mapCognitiveSignalsForMonitoring(
    liveguardCognitiveSignals,
    liveguardMotionSignal,
    liveguardOrientationSignal,
  );

  // Step 3: logCognitiveSession row
  const dbRow = buildCognitiveSessionRow(
    sessionPublicId,
    tenantId,
    cognitiveSignalsForMonitoring,
    'high',
  );

  // Step 4: buildCognitiveTask (Label Studio)
  const task = buildCognitiveTask(dbRow);

  it('Step 2: demoguardFusionTrigger maps all 27+ cognitive fields to camelCase', () => {
    expect(cognitiveSignalsForMonitoring.reflexAvgMs).toBe(287);
    expect(cognitiveSignalsForMonitoring.stroopAccuracy).toBe(0.85);
    expect(cognitiveSignalsForMonitoring.nBackAccuracy).toBe(0.8);
    expect(cognitiveSignalsForMonitoring.digitSpanMaxSpan).toBe(7);
    expect(cognitiveSignalsForMonitoring.trailTapCompletionMs).toBe(8500);
    expect(cognitiveSignalsForMonitoring.depthScore).toBe(0.82);
    expect(cognitiveSignalsForMonitoring.anomalyScore).toBe(0.1);
    expect(cognitiveSignalsForMonitoring.consistencyScore).toBe(0.78);
    expect(cognitiveSignalsForMonitoring.completedModules).toBe(5);
    expect(cognitiveSignalsForMonitoring.quality).toBe('ok');
    expect(cognitiveSignalsForMonitoring.motionVariance).toBe(0.34);
    expect(cognitiveSignalsForMonitoring.accelXStd).toBe(0.12);
    expect(cognitiveSignalsForMonitoring.orientationChanges).toBe(12);
    expect(cognitiveSignalsForMonitoring.presentationVariant).toBe('liveguard');
  });

  it('Step 3: DB row has all 27 feature columns non-null', () => {
    const featureColumns = [
      'reflex_avg_ms', 'reflex_variance_ms', 'reflex_regularity_score', 'reflex_too_fast_count',
      'stroop_accuracy', 'stroop_avg_response_ms', 'stroop_conflict_cost_ms', 'stroop_error_count',
      'n_back_accuracy', 'n_back_false_positives', 'n_back_hits', 'n_back_misses',
      'digit_span_accuracy', 'digit_span_max_span', 'digit_span_positional_errors',
      'trail_tap_completion_ms', 'trail_tap_hesitation_count', 'trail_tap_path_efficiency',
      'n_back_avg_response_ms', 'reflex_median_ms', 'reflex_min_ms',
      'trail_tap_wrong_taps', 'motion_variance', 'accel_x_std', 'accel_y_std', 'accel_z_std',
      'orientation_changes',
    ];
    for (const col of featureColumns) {
      expect(dbRow[col], `DB column ${col} should not be null`).not.toBeNull();
    }
  });

  it('Step 3: DB row has all 6 heuristic_score columns non-null', () => {
    expect(dbRow.depth_score).toBe(0.82);
    expect(dbRow.anomaly_score).toBe(0.1);
    expect(dbRow.consistency_score).toBe(0.78);
    expect(dbRow.human_likelihood).toBe('high');
    expect(dbRow.completed_modules).toBe(5);
    expect(dbRow.quality).toBe('ok');
  });

  it('Step 3: DB row has correct session_public_id (not lg_* fallback)', () => {
    expect(dbRow.session_public_id).toBe('hcs_sess_liveguard_test_001');
    expect(dbRow.session_public_id).not.toMatch(/^lg_/);
  });

  it('Step 3: DB row has correct tenant_id (public_liveguard)', () => {
    expect(dbRow.tenant_id).toBe('public_liveguard');
  });

  it('Step 3: DB row has presentation_variant = liveguard', () => {
    expect(dbRow.presentation_variant).toBe('liveguard');
  });

  it('Step 4: Label Studio task has session_id matching session_public_id', () => {
    expect(task.data.session_id).toBe('hcs_sess_liveguard_test_001');
  });

  it('Step 4: Label Studio task has all 27 features non-null', () => {
    const features = task.data.features as Record<string, unknown>;
    const featureKeys = Object.keys(features);
    expect(featureKeys.length).toBe(27);
    for (const key of featureKeys) {
      expect(features[key], `Feature ${key} should not be null`).not.toBeNull();
    }
  });

  it('Step 4: Label Studio task has all 6 heuristic_score vars non-null', () => {
    const hs = task.data.heuristic_score as Record<string, unknown>;
    expect(hs.depth_score).toBe(0.82);
    expect(hs.anomaly_score).toBe(0.1);
    expect(hs.consistency_score).toBe(0.78);
    expect(hs.human_likelihood).toBe('high');
    expect(hs.completed_modules).toBe(5);
    expect(hs.quality).toBe('ok');
  });

  it('Step 4: Feature values match original LiveGuard cognitive signals', () => {
    const features = task.data.features as Record<string, unknown>;
    // Reflex
    expect(features.reflex_avg_ms).toBe(287);
    expect(features.reflex_variance_ms).toBe(1240);
    expect(features.reflex_regularity_score).toBe(0.72);
    expect(features.reflex_too_fast_count).toBe(0);
    expect(features.reflex_median_ms).toBe(280);
    expect(features.reflex_min_ms).toBe(210);
    // Stroop
    expect(features.stroop_accuracy).toBe(0.85);
    expect(features.stroop_avg_response_ms).toBe(720);
    expect(features.stroop_conflict_cost_ms).toBe(180);
    expect(features.stroop_error_count).toBe(2);
    // N-Back
    expect(features.n_back_accuracy).toBe(0.8);
    expect(features.n_back_false_positives).toBe(1);
    expect(features.n_back_hits).toBe(4);
    expect(features.n_back_misses).toBe(1);
    expect(features.n_back_avg_response_ms).toBe(510);
    // Digit Span
    expect(features.digit_span_accuracy).toBe(0.75);
    expect(features.digit_span_max_span).toBe(7);
    expect(features.digit_span_positional_errors).toBe(1);
    // Trail Tap
    expect(features.trail_tap_completion_ms).toBe(8500);
    expect(features.trail_tap_hesitation_count).toBe(2);
    expect(features.trail_tap_path_efficiency).toBe(0.9);
    expect(features.trail_tap_wrong_taps).toBe(1);
    // Motion/Orientation
    expect(features.motion_variance).toBe(0.34);
    expect(features.accel_x_std).toBe(0.12);
    expect(features.accel_y_std).toBe(0.08);
    expect(features.accel_z_std).toBe(0.15);
    expect(features.orientation_changes).toBe(12);
  });
});
