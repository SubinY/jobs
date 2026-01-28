import { redirect } from "next/navigation";
import type { SearchParams } from "@/app/job/components/utils";

function buildQuery(searchParams?: SearchParams) {
  if (!searchParams) return "";
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0]);
      return;
    }
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

type RootPageProps = {
  searchParams?: SearchParams;
};

export default function RootPage({ searchParams }: RootPageProps) {
  redirect(`/job${buildQuery(searchParams)}`);
}
