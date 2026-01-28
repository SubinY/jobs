import type { Job } from "@/lib/types";

export type SearchParams = Record<string, string | string[] | undefined>;

export function getParam(searchParams: SearchParams | undefined, key: string, fallback: string) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0] || fallback;
  }
  return value ?? fallback;
}

export function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

type LocationOptions = {
  provinces: string[];
  citiesByProvince: Record<string, string[]>;
  districtsByCity: Record<string, string[]>;
};

function sortValues(values: string[]) {
  return values.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

export function buildLocationOptions(jobs: Job[]): LocationOptions {
  const provinces = new Set<string>();
  const citiesByProvince = new Map<string, Set<string>>();
  const districtsByCity = new Map<string, Set<string>>();

  jobs.forEach((job) => {
    if (job.province) provinces.add(job.province);
    if (job.province && job.city) {
      if (!citiesByProvince.has(job.province)) {
        citiesByProvince.set(job.province, new Set());
      }
      citiesByProvince.get(job.province)?.add(job.city);
    }
    const district = job.district || "全市";
    if (job.city) {
      if (!districtsByCity.has(job.city)) {
        districtsByCity.set(job.city, new Set());
      }
      districtsByCity.get(job.city)?.add(district);
    }
  });

  const citiesRecord: Record<string, string[]> = {};
  citiesByProvince.forEach((value, key) => {
    citiesRecord[key] = sortValues(Array.from(value));
  });

  const districtsRecord: Record<string, string[]> = {};
  districtsByCity.forEach((value, key) => {
    districtsRecord[key] = sortValues(Array.from(value));
  });

  return {
    provinces: sortValues(Array.from(provinces)),
    citiesByProvince: citiesRecord,
    districtsByCity: districtsRecord,
  };
}
