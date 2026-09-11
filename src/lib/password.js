/*
 * Shared password validation rules.
 *
 * The single source of truth for the application's password requirements.
 * Kept in sync with the signup/login form so the password-reset completion
 * flow enforces exactly the same rules (never a divergent set).
 */

export const validatePassword = (password) => {
  const value = password.trim();

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Add at least one uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Add at least one lowercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Add at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Add at least one symbol.";
  }

  return "";
};

export const getPasswordRequirements = (password) => {
  const value = password.trim();

  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value),
  };
};