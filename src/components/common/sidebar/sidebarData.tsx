import { MenuProps } from "antd";
import { Link } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];
export const MENUITEMS: MenuItem[] = [
  {
    key: "Dashboard",
    label: <Link to="/dashboard">대시보드</Link>,
    icon: (
      <img
        src="/images/pie.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    ),
  },
  {
    key: "local_analysis",
    label: "지역 별 분석",
    icon: (
      <img
        src="/images/folder.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    ),
    children: [
      { key: "map", label: <Link to="/map">지도</Link> },
      {
        key: "statists",
        label: <Link to="/statistics-by-region">지역 별 통계</Link>,
      },
    ],
  },
  {
    key: "update_data",
    label: "데이터 업데이트",
    icon: (
      <img
        src="/images/folder.svg"
        style={{ width: "1.5rem", height: "1.5rem" }}
      />
    ),
  },
];
