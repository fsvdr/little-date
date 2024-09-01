import {
  isSameDay,
  isSameYear,
  isSameMonth,
  format,
  startOfDay,
  startOfMonth,
  endOfMonth,
  endOfDay,
  isSameMinute,
  startOfYear,
  getQuarter,
  startOfQuarter,
  endOfQuarter,
  endOfYear,
} from "date-fns";

const shortenAmPm = (text: string): string => {
  const shortened = (text || "").replace(/ AM/g, "am").replace(/ PM/g, "pm");
  const withoutDoubleZero = shortened.includes("m")
    ? shortened.replace(/:00/g, "")
    : shortened;
  return withoutDoubleZero;
};

const removeLeadingZero = (text: string): string => text.replace(/^0/, "");

export const formatTime = (date: Date, locale?: string): string => {
  return removeLeadingZero(
    shortenAmPm(
      date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }) || ""
    )
  );
};

const createFormatTime =
  (locale?: string) =>
  (date: Date): string =>
    formatTime(date, locale);

const getNavigatorLanguage = (): string => {
  if (typeof window === "undefined") {
    return "en-US";
  }
  return window.navigator.language;
};

export interface DateRangeFormatOptions {
  today?: Date;
  locale?: Locale;
  timeLocale?: string;
  includeTime?: boolean;
  separator?: string;
}

export const formatDateRange = (
  from: Date,
  to: Date,
  {
    today = new Date(),
    locale,
    timeLocale = getNavigatorLanguage(),
    includeTime = true,
    separator = "-",
  }: DateRangeFormatOptions = {}
): string => {
  const sameYear = isSameYear(from, to);
  const sameMonth = isSameMonth(from, to);
  const sameDay = isSameDay(from, to);
  const thisYear = isSameYear(from, today);
  const thisDay = isSameDay(from, today);

  const yearSuffix = thisYear ? "" : `, ${format(to, "yyyy")}`;

  const formatTime = createFormatTime(timeLocale);

  const startTimeSuffix =
    includeTime && !isSameMinute(startOfDay(from), from)
      ? `, ${formatTime(from)}`
      : "";

  const endTimeSuffix =
    includeTime && !isSameMinute(endOfDay(to), to) ? `, ${formatTime(to)}` : "";

  // Check if the range is the entire year
  // Example: 2023
  if (
    isSameMinute(startOfYear(from), from) &&
    isSameMinute(endOfYear(to), to)
  ) {
    return `${format(from, "yyyy", { locale })}`;
  }

  // Check if the range is an entire quarter
  // Example: Q1 2023
  if (
    isSameMinute(startOfQuarter(from), from) &&
    isSameMinute(endOfQuarter(to), to) &&
    getQuarter(from) === getQuarter(to)
  ) {
    return `Q${getQuarter(from)} ${format(from, "yyyy", { locale })}`;
  }

  // Check if the range is across entire month
  if (
    isSameMinute(startOfMonth(from), from) &&
    isSameMinute(endOfMonth(to), to)
  ) {
    if (sameMonth && sameYear) {
      // Example: January 2023
      return `${format(from, "LLLL yyyy", { locale })}`;
    }
    // Example: Jan - Feb 2023
    return `${format(from, "LLL", { locale })} ${separator} ${format(to, "LLL yyyy", { locale })}`;
  }

  // Range across years
  // Example: Jan 1 '23 - Feb 12 '24
  if (!sameYear) {
    return `${format(
      from,
      "LLL d ''yy",
      { locale }
    )}${startTimeSuffix} ${separator} ${format(
      to,
      "LLL d ''yy",
      { locale }
    )}${endTimeSuffix}`;
  }

  // Range across months
  // Example: Jan 1 - Feb 12[, 2023]
  if (!sameMonth) {
    return `${format(from, "LLL d", { locale })}${startTimeSuffix} ${separator} ${format(
      to,
      "LLL d",
      { locale }
    )}${endTimeSuffix}${yearSuffix}`;
  }

  // Range across days
  if (!sameDay) {
    // Check for a time suffix, if so print the month twice
    // Example: Jan 1, 12:00pm - Jan 2, 1:00pm[, 2023]
    if (startTimeSuffix || endTimeSuffix) {
      return `${format(from, "LLL d", { locale })}${startTimeSuffix} ${separator} ${format(
        to,
        "LLL d",
        { locale }
      )}${endTimeSuffix}${yearSuffix}`;
    }

    // Example: Jan 1 - 12[, 2023]
    return `${format(from, "LLL d", { locale })} ${separator} ${format(
      to,
      "d",
      { locale }
    )}${yearSuffix}`;
  }

  // Same day, different times
  // Example: Jan 1, 12pm - 1pm[, 2023]
  if (startTimeSuffix || endTimeSuffix) {
    // If it's today, don't include the date
    // Example: 12:30pm - 1pm
    if (thisDay) {
      return `${formatTime(from)} ${separator} ${formatTime(to)}`;
    }

    // Example: Jan 1, 12pm - 1pm[, 2023]
    return `${format(
      from,
      "LLL d",
      { locale }
    )}${startTimeSuffix} ${separator} ${formatTime(to)}${yearSuffix}`;
  }

  // Full day
  // Example: Fri, Jan 1[, 2023]
  return `${format(from, "eee, LLL d", { locale })}${yearSuffix}`;
};
