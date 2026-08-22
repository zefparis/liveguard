/**
 * LiveGuard — Context provider
 *
 * Exposes state, dispatch, behavior session.
 * Adapted from demoguard: removed sensitive voice/selfie refs.
 *
 * @copyright (c) 2026 Benjamin BARRERE / IA SOLUTION
 * Patents Pending FR2514274 | FR2514546
 */

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { LiveGuardState, Action } from './liveguardReducer';
import type { BehaviorSession } from '../liveguard/behavior/behaviorSession';

export interface LiveGuardContextValue {
  state: LiveGuardState;
  dispatch: React.Dispatch<Action>;
  behaviorSession: BehaviorSession;
}

export const LiveGuardContext = createContext<LiveGuardContextValue | null>(null);

export function LiveGuardProvider({ value, children }: { value: LiveGuardContextValue; children: ReactNode }) {
  return <LiveGuardContext.Provider value={value}>{children}</LiveGuardContext.Provider>;
}

export function useLiveGuard(): LiveGuardContextValue {
  const ctx = useContext(LiveGuardContext);
  if (!ctx) throw new Error('useLiveGuard must be used within LiveGuardProvider');
  return ctx;
}
