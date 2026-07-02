/**
 * Normalize Laravel / API validation error responses.
 *
 * @param {import('axios').AxiosError} error
 * @returns {{ message: string, fieldErrors: Record<string, string> }}
 */
export function parseApiErrors(error) {
  const data = error?.response?.data ?? {};
  const fieldErrors = {};

  if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    Object.entries(data.errors).forEach(([field, messages]) => {
      const value = Array.isArray(messages) ? messages[0] : messages;
      if (value) {
        fieldErrors[field] = String(value);
      }
    });
  }

  const firstFieldError = Object.values(fieldErrors)[0];
  const message =
    data.message ||
    data.error ||
    firstFieldError ||
    error?.message ||
    "Something went wrong. Please try again.";

  return { message, fieldErrors };
}

export function getApiErrorMessage(error, fallback = "Something went wrong.") {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (data.errors && typeof data.errors === "object") {
    const firstField = Object.values(data.errors).flat().find(Boolean);
    if (typeof firstField === "string" && firstField.trim()) {
      return firstField;
    }
  }

  if (typeof data.message === "string" && data.message.trim() && data.message !== "Server Error") {
    return data.message;
  }

  return fallback;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}
