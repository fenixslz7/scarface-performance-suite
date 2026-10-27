// Logins are usernames; auth needs an email, so we derive a fixed synthetic one.
export const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@scarface.local`;
