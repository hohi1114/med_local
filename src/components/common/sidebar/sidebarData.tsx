import { MenuProps } from "antd";

export type MenuItem = Required<MenuProps>["items"][number];
export const MENUITEMS: MenuItem[] = [
  {
    key: "dashboard",
    label: "대시보드",
    icon: (
      <img
        src="/images/pie.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    )
  },
  {
    key: "compare-avenue",
    label: "기간별 매출 리포트",
    icon: (
      <img
        src="/images/calendar.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    )
  },
  {
    key: "local_analysis",
    label: "지역 별 분석",
    icon: (
      <img
        src="/images/analysis.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    ),
    children: [
      { key: "map", label: "지도" },
      {
        key: "statistics-by-region",
        label: "지역 별 통계"
      }
    ]
  },
  {
    key: "update_data",
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>데이터 업데이트</span>
      </div>
    ),
    icon: (
      <img
        src="/images/update.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    )
  },
  {
    key: "setting",
    label: (
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>설정</span>
      </div>
    ),
    icon: (
      <img
        src="/images/settings.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    ),
    children: [
      { key: "account", label: "계정" },
      {
        key: "membership",
        label: "멤버십 관리"
      }
    ]
  }
];
