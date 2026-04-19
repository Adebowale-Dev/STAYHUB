export const AUTH_TOKEN_COOKIE = 'stayhub-token';
export const AUTH_ROLE_COOKIE = 'stayhub-role';

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const getCookieBase = (maxAge: number) =>
  `Path=/; Max-Age=${maxAge}; SameSite=Lax`;

const setCookie = (name: string, value: string, maxAge: number) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; ${getCookieBase(
    maxAge
  )}`;
};

export const syncAuthCookies = (
  token: string | null | undefined,
  role: string | null | undefined
) => {
  if (typeof document === 'undefined') {
    return;
  }

  if (token) {
    setCookie(AUTH_TOKEN_COOKIE, token, AUTH_COOKIE_MAX_AGE_SECONDS);
  } else {
    document.cookie = `${AUTH_TOKEN_COOKIE}=; ${getCookieBase(0)}`;
  }

  if (role) {
    setCookie(AUTH_ROLE_COOKIE, role, AUTH_COOKIE_MAX_AGE_SECONDS);
  } else {
    document.cookie = `${AUTH_ROLE_COOKIE}=; ${getCookieBase(0)}`;
  }
};
