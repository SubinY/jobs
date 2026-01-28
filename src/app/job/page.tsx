import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { getDataStore } from "@/lib/store";
import JobsFilterPanel from "./components/JobsFilterPanel";
import JobsTable from "./components/JobsTable";
import { JOB_TYPES } from "./components/constants";
import { buildLocationOptions, getParam, type SearchParams } from "./components/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

type HomePageProps = {
  searchParams?: SearchParams;
};

export default async function JobHomePage({ searchParams }: HomePageProps) {
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);
  const canAccess = Boolean(user && (user.entitled || user.role === "admin"));
  const store = await getDataStore();
  const [jobs, actions] = await Promise.all([
    store.listJobs(),
    user && canAccess ? store.listJobActions(user.id) : Promise.resolve([]),
  ]);
  const actionMap = new Map(actions.map((action) => [action.jobId, action]));

  const typeFilter = getParam(searchParams, "type", "all");
  const provinceFilter = getParam(searchParams, "province", "all");
  const cityFilter = getParam(searchParams, "city", "all");
  const districtFilter = getParam(searchParams, "district", "all");
  const nationwideParam = getParam(searchParams, "nationwide", "");
  const appliedFilter = getParam(searchParams, "applied", "all");
  const effectiveAppliedFilter = canAccess ? appliedFilter : "all";
  const page = Math.max(1, Number(getParam(searchParams, "page", "1")) || 1);

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const locationOptions = buildLocationOptions(sortedJobs);
  const provinceOptions = locationOptions.provinces;
  const safeProvinceFilter = provinceOptions.includes(provinceFilter)
    ? provinceFilter
    : "all";
  const cityOptions =
    safeProvinceFilter === "all"
      ? []
      : locationOptions.citiesByProvince[safeProvinceFilter] ?? [];
  const safeCityFilter = cityOptions.includes(cityFilter) ? cityFilter : "all";
  const districtOptions =
    safeCityFilter === "all"
      ? []
      : locationOptions.districtsByCity[safeCityFilter] ?? [];
  const safeDistrictFilter = districtOptions.includes(districtFilter)
    ? districtFilter
    : "all";

  const nationwide = nationwideParam === "1";
  const activeProvince = nationwide ? "all" : safeProvinceFilter;
  const activeCity = nationwide ? "all" : safeCityFilter;
  const activeDistrict = nationwide ? "all" : safeDistrictFilter;

  const filteredJobs = sortedJobs.filter((job) => {
    if (typeFilter !== "all" && job.category !== typeFilter) return false;
    if (!nationwide) {
      if (activeProvince !== "all" && job.province !== activeProvince) return false;
      if (activeCity !== "all" && job.city !== activeCity) return false;
      if (activeDistrict !== "all" && job.district !== activeDistrict) return false;
    }
    if (effectiveAppliedFilter !== "all" && canAccess) {
      const applied = actionMap.get(job.id)?.applied ?? false;
      if (effectiveAppliedFilter === "applied" && !applied) return false;
      if (effectiveAppliedFilter === "unapplied" && applied) return false;
    }
    return true;
  });

  const total = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageJobs = filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);

  const params = new URLSearchParams();
  if (typeFilter !== "all") params.set("type", typeFilter);
  if (nationwide) {
    params.set("nationwide", "1");
  } else {
    if (activeProvince !== "all") params.set("province", activeProvince);
    if (activeCity !== "all") params.set("city", activeCity);
    if (activeDistrict !== "all") params.set("district", activeDistrict);
  }
  if (effectiveAppliedFilter !== "all") params.set("applied", effectiveAppliedFilter);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const windowSize = 2;
    const start = Math.max(2, currentPage - windowSize);
    const end = Math.min(totalPages - 1, currentPage + windowSize);

    pages.push(1);
    if (start > 2) pages.push("ellipsis-start");
    for (let p = start; p <= end; p += 1) pages.push(p);
    if (end < totalPages - 1) pages.push("ellipsis-end");
    if (totalPages > 1) pages.push(totalPages);

    return (
      <div className="pagination">
        <div className="page-info">
          共 {total} 条 · 当前第 {currentPage} / {totalPages} 页
        </div>
        <div className="page-links">
          {currentPage > 1 ? (
            <Link
              className="page-link"
              href={`/job?${new URLSearchParams({
                ...Object.fromEntries(params.entries()),
                page: String(currentPage - 1),
              }).toString()}`}
            >
              上一页
            </Link>
          ) : null}
          {pages.map((item) => {
            if (typeof item === "string") {
              return (
                <span key={item} className="page-ellipsis">
                  ...
                </span>
              );
            }
            const linkParams = new URLSearchParams(params);
            linkParams.set("page", String(item));
            return (
              <Link
                key={item}
                className={`page-link ${item === currentPage ? "active" : ""}`}
                href={`/job?${linkParams.toString()}`}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </Link>
            );
          })}
          {currentPage < totalPages ? (
            <Link
              className="page-link"
              href={`/job?${new URLSearchParams({
                ...Object.fromEntries(params.entries()),
                page: String(currentPage + 1),
              }).toString()}`}
            >
              下一页
            </Link>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <SiteHeader />
      <main className="container" style={{ padding: "48px 0 90px" }}>
        <div className="jobs-hero">
          <div>
            <span className="badge">求职表格明细</span>
            <h1 className="section-title" style={{ marginTop: 12 }}>
              招聘信息一览
            </h1>
            <p className="section-desc">
              掌握最新岗位、筛选投递策略，并为每一次投递留下进度记录。
            </p>
          </div>
          <div className="jobs-hero-card">
            <div>
              <p className="hero-label">本页数据规模</p>
              <h3>{total} 条岗位</h3>
              <p>单页 {PAGE_SIZE} 条 · 支持筛选与投递标记</p>
            </div>
            {!canAccess ? (
              <div className="hero-lock">
                <span>会员权益</span>
                <p>开通后可查看投递链接、原文与个人备注。</p>
                {isLoggedIn ? (
                  <span className="lock-text">当前账号未授权</span>
                ) : (
                  <Link className="btn btn-primary" href="/auth/login">
                    登录 / 开通
                  </Link>
                )}
              </div>
            ) : (
              <div className="hero-lock">
                <span>已开通权限</span>
                <p>投递链接与操作区已解锁，可开始追踪投递进度。</p>
              </div>
            )}
          </div>
        </div>

        <JobsFilterPanel
          values={{
            type: typeFilter,
            province: activeProvince,
            city: activeCity,
            district: activeDistrict,
            applied: effectiveAppliedFilter,
            nationwide,
          }}
          options={{
            types: [
              { label: "全部岗位", value: "all" },
              ...JOB_TYPES.map((type) => ({ label: type, value: type })),
            ],
            provinces: provinceOptions,
            cities: cityOptions,
            districts: districtOptions,
          }}
          canAccess={canAccess}
        />

        <div className="jobs-table-wrap">
          <JobsTable
            jobs={pageJobs}
            canAccess={canAccess}
            isLoggedIn={isLoggedIn}
            actionMap={actionMap}
          />
        </div>

        {renderPagination()}
      </main>
      <SiteFooter />
    </div>
  );
}
