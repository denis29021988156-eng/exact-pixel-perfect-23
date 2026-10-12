/**
 * Memory Layer — controlled conversation state.
 * Stores only last 3 messages + last context. No full history accumulation.
 */

import type { CityAIContext } from './dataAggregator';

type Msg = { role: 'user' | 'assistant'; content: string };

const MAX_MESSAGES = 6; // 3 user + 3 assistant

let lastContext: CityAIContext | null = null;
let cachedBriefing: { text: string; generatedAt: string } | null = null;

export function getLastContext(): CityAIContext | null {
  return lastContext;
}

export function setLastContext(ctx: CityAIContext) {
  lastContext = ctx;
}

export function getCachedBriefing() {
  return cachedBriefing;
}

export function setCachedBriefing(text: string, generatedAt: string) {
  cachedBriefing = { text, generatedAt };
}

export function trimMessages(messages: Msg[]): Msg[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  return messages.slice(-MAX_MESSAGES);
}
