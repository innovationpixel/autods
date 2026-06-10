export function getUserFullName(user) {
  if (!user) return "Account";
  const name = user.name?.trim();
  if (name) return name;
  if (user.email) return user.email.split("@")[0];
  return "Account";
}

/** First name (or email local-part) for compact header display */
export function getUserShortName(user) {
  if (!user) return "Account";
  const name = user.name?.trim();
  if (name) return name.split(/\s+/)[0];
  if (user.email) return user.email.split("@")[0];
  return "Account";
}

export function getUserEmail(user) {
  return user?.email?.trim() ?? "";
}

export function getUserInitials(user) {
  const name = getUserFullName(user);
  const email = getUserEmail(user);
  const source = name !== "Account" ? name : email || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
