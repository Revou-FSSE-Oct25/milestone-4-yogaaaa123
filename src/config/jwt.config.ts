export const jwtConfig = {
  secret: process.env.JWT_SECRET ?? 'fallback_dev_secret_change_in_production',
  expiresIn: Number(process.env.JWT_EXPIRES_IN_SECONDS) || 86400, // 1 day in seconds
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    'fallback_refresh_secret_change_in_production',
  refreshExpiresIn:
    Number(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS) || 604800, // 7 days in seconds
};
