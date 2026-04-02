/** Centralized app configuration — read from env vars at runtime. */

export const appConfig = {
  /** Display name shown in header and page titles */
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Agent Metrics Dashboard',

  /** Backend API base URL */
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005',

  /** Path to the logo image in /public */
  logoPath: '/assets/logo/meeting_whisper_logo.png',

  /** Local dev port */
  port: 3006,
} as const;
