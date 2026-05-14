import { AnalyticsData, PlatformStats } from "../types";

export const viewsOverTime: AnalyticsData[] = [
  { label: "May 1", value: 245 }, { label: "May 2", value: 312 }, { label: "May 3", value: 289 }, { label: "May 4", value: 378 },
  { label: "May 5", value: 456 }, { label: "May 6", value: 423 }, { label: "May 7", value: 567 }, { label: "May 8", value: 612 },
  { label: "May 9", value: 589 }, { label: "May 10", value: 678 }, { label: "May 11", value: 723 }, { label: "May 12", value: 698 },
  { label: "May 13", value: 756 }, { label: "May 14", value: 834 }, { label: "May 15", value: 912 }, { label: "May 16", value: 876 },
  { label: "May 17", value: 945 }, { label: "May 18", value: 1023 }, { label: "May 19", value: 987 }, { label: "May 20", value: 1067 },
  { label: "May 21", value: 1123 }, { label: "May 22", value: 1089 }, { label: "May 23", value: 1178 }, { label: "May 24", value: 1245 },
  { label: "May 25", value: 1198 }, { label: "May 26", value: 1289 }, { label: "May 27", value: 1345 }, { label: "May 28", value: 1423 },
  { label: "May 29", value: 1389 }, { label: "May 30", value: 1456 },
];

export const registrationTrends: AnalyticsData[] = [
  { label: "May 1", value: 12 }, { label: "May 2", value: 18 }, { label: "May 3", value: 15 }, { label: "May 4", value: 22 },
  { label: "May 5", value: 28 }, { label: "May 6", value: 25 }, { label: "May 7", value: 35 }, { label: "May 8", value: 42 },
  { label: "May 9", value: 38 }, { label: "May 10", value: 45 }, { label: "May 11", value: 52 }, { label: "May 12", value: 48 },
  { label: "May 13", value: 55 }, { label: "May 14", value: 62 }, { label: "May 15", value: 68 }, { label: "May 16", value: 58 },
  { label: "May 17", value: 72 }, { label: "May 18", value: 78 }, { label: "May 19", value: 65 }, { label: "May 20", value: 82 },
  { label: "May 21", value: 88 }, { label: "May 22", value: 75 }, { label: "May 23", value: 92 }, { label: "May 24", value: 98 },
  { label: "May 25", value: 85 }, { label: "May 26", value: 105 }, { label: "May 27", value: 112 }, { label: "May 28", value: 95 },
  { label: "May 29", value: 108 }, { label: "May 30", value: 118 },
];

export const categoryDistribution: AnalyticsData[] = [
  { label: "Tech", value: 35 }, { label: "Business", value: 22 }, { label: "Arts & Culture", value: 15 },
  { label: "Education", value: 12 }, { label: "Music", value: 8 }, { label: "Health", value: 4 }, { label: "Food", value: 3 }, { label: "Community", value: 1 },
];

export const subCityDistribution: AnalyticsData[] = [
  { label: "Bole", value: 42 }, { label: "Arada", value: 18 }, { label: "Kirkos", value: 15 },
  { label: "Yeka", value: 12 }, { label: "Lideta", value: 8 }, { label: "Kolfe Keranio", value: 5 },
];

export const hourlyRegistrationPattern: AnalyticsData[] = [
  { label: "6AM", value: 5 }, { label: "7AM", value: 8 }, { label: "8AM", value: 15 }, { label: "9AM", value: 28 },
  { label: "10AM", value: 35 }, { label: "11AM", value: 42 }, { label: "12PM", value: 38 }, { label: "1PM", value: 30 },
  { label: "2PM", value: 45 }, { label: "3PM", value: 52 }, { label: "4PM", value: 48 }, { label: "5PM", value: 40 },
  { label: "6PM", value: 55 }, { label: "7PM", value: 62 }, { label: "8PM", value: 50 }, { label: "9PM", value: 35 },
];

export const monthlyGrowth: AnalyticsData[] = [
  { label: "Jan", value: 1200 }, { label: "Feb", value: 1500 }, { label: "Mar", value: 2100 },
  { label: "Apr", value: 2800 }, { label: "May", value: 3500 },
];

export const dailyActiveUsers: AnalyticsData[] = [
  { label: "May 1", value: 120 }, { label: "May 5", value: 145 }, { label: "May 10", value: 168 },
  { label: "May 15", value: 192 }, { label: "May 20", value: 215 }, { label: "May 25", value: 238 }, { label: "May 30", value: 256 },
];

export const platformStats: PlatformStats = {
  totalEvents: 156,
  totalRegistrations: 12847,
  activeUsers: 8432,
  totalOrganizers: 89,
  growthRate: 23.5,
  conversionRate: 34.2,
};
