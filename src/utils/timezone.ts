import { format, toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Timezone utility functions for handling user timezone preferences
 */

/**
 * Get user's timezone from their profile, fallback to UTC
 */
export const getUserTimezone = (userTimezone?: string): string => {
  return userTimezone || 'UTC';
};

/**
 * Convert UTC date to user's local timezone
 */
export const convertToUserTimezone = (utcDate: Date | string, userTimezone?: string): Date => {
  const timezone = getUserTimezone(userTimezone);
  return toZonedTime(new Date(utcDate), timezone);
};

/**
 * Convert local date to UTC
 */
export const convertToUTC = (localDate: Date | string, userTimezone?: string): Date => {
  const timezone = getUserTimezone(userTimezone);
  return fromZonedTime(new Date(localDate), timezone);
};

/**
 * Format date according to user's timezone and locale
 */
export const formatUserDate = (
  date: Date | string, 
  userTimezone?: string, 
  formatStr: string = 'yyyy-MM-dd HH:mm:ss zzz'
): string => {
  const timezone = getUserTimezone(userTimezone);
  const zonedDate = toZonedTime(new Date(date), timezone);
  return format(zonedDate, formatStr, { timeZone: timezone });
};

/**
 * Format date for display in user's local time
 */
export const formatUserFriendlyDate = (
  date: Date | string, 
  userTimezone?: string,
  locale: string = 'en-US'
): string => {
  const timezone = getUserTimezone(userTimezone);
  const zonedDate = toZonedTime(new Date(date), timezone);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short'
  }).format(zonedDate);
};

/**
 * Get current time in user's timezone
 */
export const getCurrentUserTime = (userTimezone?: string): Date => {
  const timezone = getUserTimezone(userTimezone);
  return toZonedTime(new Date(), timezone);
};

/**
 * List of common timezones for user selection
 */
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Oslo',
  'Europe/Zurich',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Manila',
  'Asia/Jakarta',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Adelaide',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Casablanca'
];

/**
 * Validate if a timezone string is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

/**
 * Get timezone offset from UTC in hours
 */
export const getTimezoneOffset = (timezone: string): number => {
  const date = new Date();
  const utcDate = new Date(date.toUTCString());
  const zonedDate = toZonedTime(utcDate, timezone);
  return (zonedDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
};