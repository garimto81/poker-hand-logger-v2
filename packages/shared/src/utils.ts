/**
 * 포커 핸드 로거 v2.0 - 공유 유틸리티 함수
 */

import { VALIDATION, ERROR_CODES } from './constants';
import type { ValidationError, Position } from './types';

// ========================================
// Validation Utilities
// ========================================

export function validatePlayerName(name: string): ValidationError | null {
  if (!name || name.trim().length < VALIDATION.PLAYER_NAME.MIN_LENGTH) {
    return {
      field: 'name',
      message: `플레이어 이름은 최소 ${VALIDATION.PLAYER_NAME.MIN_LENGTH}자 이상이어야 합니다.`
    };
  }

  if (name.length > VALIDATION.PLAYER_NAME.MAX_LENGTH) {
    return {
      field: 'name',
      message: `플레이어 이름은 최대 ${VALIDATION.PLAYER_NAME.MAX_LENGTH}자 이하여야 합니다.`
    };
  }

  if (!VALIDATION.PLAYER_NAME.PATTERN.test(name)) {
    return {
      field: 'name',
      message: '플레이어 이름은 영문, 한글, 숫자, 밑줄, 하이픈만 사용할 수 있습니다.'
    };
  }

  return null;
}

export function validateTableName(name: string): ValidationError | null {
  if (!name || name.trim().length < VALIDATION.TABLE_NAME.MIN_LENGTH) {
    return {
      field: 'name',
      message: `테이블 이름은 최소 ${VALIDATION.TABLE_NAME.MIN_LENGTH}자 이상이어야 합니다.`
    };
  }

  if (name.length > VALIDATION.TABLE_NAME.MAX_LENGTH) {
    return {
      field: 'name',
      message: `테이블 이름은 최대 ${VALIDATION.TABLE_NAME.MAX_LENGTH}자 이하여야 합니다.`
    };
  }

  if (!VALIDATION.TABLE_NAME.PATTERN.test(name)) {
    return {
      field: 'name',
      message: '테이블 이름은 영문, 한글, 숫자, 밑줄, 하이픈만 사용할 수 있습니다.'
    };
  }

  return null;
}

export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return null; // Email is optional
  }

  if (!VALIDATION.EMAIL.PATTERN.test(email)) {
    return {
      field: 'email',
      message: '올바른 이메일 형식이 아닙니다.'
    };
  }

  return null;
}

export function validateChipAmount(amount: number, fieldName: string = 'amount'): ValidationError | null {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return {
      field: fieldName,
      message: '칩 수량은 숫자여야 합니다.'
    };
  }

  if (amount < VALIDATION.CHIPS.MIN) {
    return {
      field: fieldName,
      message: `칩 수량은 ${VALIDATION.CHIPS.MIN} 이상이어야 합니다.`
    };
  }

  if (amount > VALIDATION.CHIPS.MAX) {
    return {
      field: fieldName,
      message: `칩 수량은 ${VALIDATION.CHIPS.MAX} 이하여야 합니다.`
    };
  }

  return null;
}

// ========================================
// Formatting Utilities
// ========================================

export function formatChips(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(2)}K`;
  }
  return amount.toString();
}

export function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('ko-KR');
    case 'long':
      return d.toLocaleString('ko-KR');
    case 'time':
      return d.toLocaleTimeString('ko-KR');
    default:
      return d.toLocaleDateString('ko-KR');
  }
}

// ========================================
// Position Utilities
// ========================================

export function getPositionDisplayName(position: Position): string {
  const displayNames: Record<Position, string> = {
    SB: 'Small Blind',
    BB: 'Big Blind',
    UTG: 'Under the Gun',
    'UTG+1': 'UTG+1',
    'UTG+2': 'UTG+2',
    MP: 'Middle Position',
    'MP+1': 'MP+1',
    HJ: 'Hijack',
    CO: 'Cutoff',
    BTN: 'Button'
  };

  return displayNames[position];
}

export function getPositionAbbreviation(position: Position): string {
  return position;
}

// ========================================
// Card Utilities
// ========================================

export function parseCards(cardsJson: string): string[] {
  try {
    return JSON.parse(cardsJson);
  } catch {
    return [];
  }
}

export function stringifyCards(cards: string[]): string {
  return JSON.stringify(cards);
}

export function validateCard(card: string): boolean {
  // Format: Rank + Suit (e.g., "As", "Kh", "Qd", "Jc", "Ts", "9s", etc.)
  const cardPattern = /^(A|K|Q|J|T|[2-9])(s|h|d|c)$/;
  return cardPattern.test(card);
}

// ========================================
// Error Utilities
// ========================================

export function createError(code: string, message: string, validationErrors?: ValidationError[]) {
  return {
    success: false as const,
    error: message,
    code,
    validationErrors
  };
}

export function isValidationError(error: any): error is { validationErrors: ValidationError[] } {
  return error && Array.isArray(error.validationErrors);
}

// ========================================
// Array Utilities
// ========================================

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

// ========================================
// Math Utilities
// ========================================

export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// ========================================
// Delay Utility
// ========================================

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================
// Retry Utility
// ========================================

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay: retryDelay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(lastError, attempt);
        await delay(retryDelay * attempt); // Exponential backoff
      }
    }
  }

  throw lastError!;
}

// ========================================
// Debounce Utility
// ========================================

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

// ========================================
// Throttle Utility
// ========================================

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }
  };
}
