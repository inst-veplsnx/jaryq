export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD_LENGTH = 6;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email енгізіңіз';
  if (!EMAIL_REGEX.test(email.trim())) return 'Дұрыс email енгізіңіз';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Құпия сөз енгізіңіз';
  if (password.length < MIN_PASSWORD_LENGTH) return `Кемінде ${MIN_PASSWORD_LENGTH} таңба`;
  if (!/[A-Z]/.test(password)) return 'Кем дегенде бір бас әріп болуы керек';
  if (!/[0-9]/.test(password)) return 'Кем дегенде бір цифр болуы керек';
  return null;
}
