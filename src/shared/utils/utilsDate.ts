import { DateTime } from 'luxon';

export class DateUtils {
  /**
   * Get date now, ex: 2025-07-05 11:25:30
   *
   * @param timezone Timezone, ex: 'America/Sao_Paulo'
   * @param format Mask date, ex: 'yyyy-MM-dd HH:mm:ss'
   * @returns {string} The formatted current date.
   *
   * @example
   * // Get current date in São Paulo timezone, default format
   * const now = DateUtils.getCurrentDate(); // '2025-07-05 11:25:30'
   *
   **/
  static getCurrentDate(
    timezone: string = 'America/Sao_Paulo',
    format: string = 'yyyy-MM-dd HH:mm:ss',
  ): string {
    return DateTime.now().setZone(timezone).toFormat(format);
  }
}
