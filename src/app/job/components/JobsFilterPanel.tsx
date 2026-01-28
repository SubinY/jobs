"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type FilterOption = { label: string; value: string };

type FilterChipsProps = {
  name: string;
  value: string;
  options: FilterOption[];
  variant?: "pill" | "checkbox";
  disabled?: boolean;
  onValueChange?: (next: string) => void;
};

function FilterChips({
  name,
  value,
  options,
  variant = "pill",
  disabled = false,
  onValueChange,
}: FilterChipsProps) {
  const inputType = "radio";
  return (
    <div className="filter-chips" data-variant={variant}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "filter-chip",
              checked && "is-active",
              disabled && "is-disabled"
            )}
            data-variant={variant}
          >
            <input
              type={inputType}
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onValueChange?.(option.value)}
            />
            <span className="filter-chip-box" aria-hidden="true" />
            <span className="filter-chip-text">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

type JobsFilterPanelProps = {
  values: {
    type: string;
    province: string;
    city: string;
    district: string;
    applied: string;
    nationwide: boolean;
  };
  options: {
    types: FilterOption[];
    provinces: string[];
    cities: string[];
    districts: string[];
  };
  canAccess: boolean;
};

export default function JobsFilterPanel({
  values,
  options,
  canAccess,
}: JobsFilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [type, setType] = useState(values.type);
  const [province, setProvince] = useState(values.province);
  const [city, setCity] = useState(values.city);
  const [district, setDistrict] = useState(values.district);
  const [applied, setApplied] = useState(values.applied);
  const [nationwide, setNationwide] = useState(values.nationwide);

  useEffect(() => {
    setType(values.type);
    setProvince(values.province);
    setCity(values.city);
    setDistrict(values.district);
    setApplied(values.applied);
    setNationwide(values.nationwide);
  }, [values]);

  const defaultParams = useMemo(
    () => new URLSearchParams(searchParams?.toString()),
    [searchParams]
  );

  const pushFilters = useCallback(
    (next: {
      type?: string;
      province?: string;
      city?: string;
      district?: string;
      applied?: string;
      nationwide?: boolean;
    }) => {
      const nextType = next.type ?? type;
      const nextApplied = next.applied ?? applied;
      const nextNationwide = next.nationwide ?? nationwide;
      const nextProvince = next.province ?? province;
      const nextCity = next.city ?? city;
      const nextDistrict = next.district ?? district;

      const params = new URLSearchParams(defaultParams);
      params.delete("page");

      if (nextType && nextType !== "all") params.set("type", nextType);
      else params.delete("type");

      if (nextApplied && nextApplied !== "all") params.set("applied", nextApplied);
      else params.delete("applied");

      if (nextNationwide) {
        params.set("nationwide", "1");
        params.delete("province");
        params.delete("city");
        params.delete("district");
      } else {
        params.delete("nationwide");
        if (nextProvince && nextProvince !== "all") params.set("province", nextProvince);
        else params.delete("province");
        if (nextCity && nextCity !== "all") params.set("city", nextCity);
        else params.delete("city");
        if (nextDistrict && nextDistrict !== "all") params.set("district", nextDistrict);
        else params.delete("district");
      }

      const query = params.toString();
      router.replace(query ? `/job?${query}` : "/job");
    },
    [applied, city, defaultParams, district, nationwide, province, router, type]
  );

  const handleTypeChange = (nextValue: string) => {
    setType(nextValue);
    pushFilters({ type: nextValue });
  };

  const handleAppliedChange = (nextValue: string) => {
    setApplied(nextValue);
    pushFilters({ applied: nextValue });
  };

  const handleNationwideToggle = (checked: boolean) => {
    setNationwide(checked);
    if (checked) {
      setProvince("all");
      setCity("all");
      setDistrict("all");
      pushFilters({
        nationwide: true,
        province: "all",
        city: "all",
        district: "all",
      });
    } else {
      pushFilters({ nationwide: false });
    }
  };

  const handleProvinceChange = (nextValue: string) => {
    setProvince(nextValue);
    setCity("all");
    setDistrict("all");
    setNationwide(false);
    pushFilters({
      nationwide: false,
      province: nextValue,
      city: "all",
      district: "all",
    });
  };

  const handleCityChange = (nextValue: string) => {
    setCity(nextValue);
    setDistrict("all");
    setNationwide(false);
    pushFilters({
      nationwide: false,
      city: nextValue,
      district: "all",
    });
  };

  const handleDistrictChange = (nextValue: string) => {
    setDistrict(nextValue);
    setNationwide(false);
    pushFilters({
      nationwide: false,
      district: nextValue,
    });
  };

  return (
    <form className="filter-panel" method="get">
      <div className="filter-head">
        <div>
          <h2>筛选条件</h2>
          <p>组合筛选岗位类型、地区与投递状态，快速定位目标岗位。</p>
        </div>
        <div className="filter-actions">
          <Link className="btn btn-ghost" href="/job">
            重置
          </Link>
          <Button type="submit" variant="primary">
            应用筛选
          </Button>
        </div>
      </div>

      <div className="filter-rows">
        <div className="filter-row">
          <span className="filter-row-label">岗位类型</span>
          <div className="filter-row-content">
            <FilterChips
              name="type"
              value={type}
              options={options.types}
              onValueChange={handleTypeChange}
            />
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-row-label">范围/地区</span>
          <div className="filter-row-content filter-location">
            <label className={cn("filter-checkbox", nationwide && "is-active")}>
              <Checkbox
                name="nationwide"
                value="1"
                checked={nationwide}
                onChange={(event) => handleNationwideToggle(event.target.checked)}
              />
              <span>全国</span>
            </label>
            <div className="filter-selects">
              <Select
                name="province"
                value={province}
                onChange={(event) => handleProvinceChange(event.target.value)}
              >
                <option value="all">全部省份</option>
                {options.provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </Select>
              <Select
                name="city"
                value={city}
                disabled={province === "all"}
                onChange={(event) => handleCityChange(event.target.value)}
              >
                <option value="all">全部城市</option>
                {options.cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
              <Select
                name="district"
                value={district}
                disabled={city === "all"}
                onChange={(event) => handleDistrictChange(event.target.value)}
              >
                <option value="all">全部区县</option>
                {options.districts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="filter-row">
          <span className="filter-row-label">投递状态</span>
          <div className="filter-row-content">
            <FilterChips
              name="applied"
              value={applied}
              options={[
                { label: "全部", value: "all" },
                { label: "已投递", value: "applied" },
                { label: "未投递", value: "unapplied" },
              ]}
              disabled={!canAccess}
              onValueChange={handleAppliedChange}
            />
            {!canAccess ? (
              <span className="filter-hint">会员解锁投递状态筛选</span>
            ) : null}
          </div>
        </div>
      </div>
    </form>
  );
}
