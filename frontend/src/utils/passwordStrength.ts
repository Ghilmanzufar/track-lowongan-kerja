// Password Strength Evaluation Utility

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: 'Sangat Lemah' | 'Lemah' | 'Sedang' | 'Kuat' | 'Sangat Kuat';
  color: string;
  percent: number;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { score: 0, label: 'Sangat Lemah', color: '#ef4444', percent: 0 };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalize score between 0 and 4
  const normalizedScore = Math.min(4, Math.max(0, score - 1));

  const map: Record<number, { label: PasswordStrengthResult['label']; color: string; percent: number }> = {
    0: { label: 'Sangat Lemah', color: '#ef4444', percent: 20 },
    1: { label: 'Lemah', color: '#f97316', percent: 40 },
    2: { label: 'Sedang', color: '#eab308', percent: 60 },
    3: { label: 'Kuat', color: '#10b981', percent: 80 },
    4: { label: 'Sangat Kuat', color: '#059669', percent: 100 }
  };

  const { label, color, percent } = map[normalizedScore];
  return { score: normalizedScore, label, color, percent };
}
