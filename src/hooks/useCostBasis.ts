import { useMemo, useState } from "react";
import { DashBoard } from "../types/dashboard";

// 매출 표시 기준: 과세만 볼지, 비과세까지 합쳐 볼지
export type CostBasis = "taxable" | "all";

type CostMap = Record<string, number>;

function mergeCostMaps(base: CostMap = {}, extra: CostMap = {}): CostMap {
  const merged: CostMap = { ...base };
  Object.entries(extra).forEach(([key, value]) => {
    merged[key] = (merged[key] || 0) + value;
  });
  return merged;
}

function diffRate(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function divideByDate(costs: CostMap, counts: CostMap): CostMap {
  const result: CostMap = {};
  Object.entries(costs).forEach(([date, cost]) => {
    const count = counts[date] || 0;
    result[date] = count > 0 ? Math.round(cost / count) : 0;
  });
  return result;
}

function toCombinedDashboard(data: DashBoard): DashBoard {
  const totalCost = data.total_cost + (data.total_non_taxable_cost ?? 0);
  const prevTotalCost =
    (data.prev_total_cost ?? 0) + (data.prev_total_non_taxable_cost ?? 0);
  const costByDate = mergeCostMaps(
    data.cost_by_date,
    data.non_taxable_cost_by_date
  );

  return {
    ...data,
    total_cost: totalCost,
    cost_by_date: costByDate,
    average_cost_per_visit:
      data.total_visit_count > 0
        ? Math.round(totalCost / data.total_visit_count)
        : 0,
    average_cost_per_visit_by_date: divideByDate(
      costByDate,
      data.visit_count_by_date
    ),
    sinhwan_cost_by_date: mergeCostMaps(
      data.sinhwan_cost_by_date,
      data.non_taxable_sinhwan_cost_by_date
    ),
    chojin_rejin_cost_by_date: mergeCostMaps(
      data.chojin_rejin_cost_by_date,
      data.non_taxable_chojin_rejin_cost_by_date
    ),
    total_cost_by_day_of_week: mergeCostMaps(
      data.total_cost_by_day_of_week,
      data.non_taxable_cost_by_day_of_week
    ),
    diff_rates: {
      ...data.diff_rates,
      // 이전 기간 합산 매출이 0이면 증감을 낼 수 없어 과세 기준 값을 그대로 둔다
      total_cost: diffRate(totalCost, prevTotalCost) ?? data.diff_rates.total_cost
    }
  };
}

// 비과세 매출이 내려오는 EMR(vegas 계열)에서만 기준 전환 UI를 노출한다.
export function useCostBasis(data: DashBoard) {
  const [costBasis, setCostBasis] = useState<CostBasis>("taxable");
  const hasNonTaxableCost = data?.non_taxable_cost_by_date !== undefined;

  const dashboardData = useMemo(() => {
    if (!data || !hasNonTaxableCost || costBasis === "taxable") return data;
    return toCombinedDashboard(data);
  }, [data, hasNonTaxableCost, costBasis]);

  return { costBasis, setCostBasis, hasNonTaxableCost, dashboardData };
}
