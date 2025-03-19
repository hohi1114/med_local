import { Table } from "antd";
import type { TableProps } from "antd";
import styled from "styled-components";
import { Region } from "../../../types/dashboard";

const columns: TableProps<Region>["columns"] = [
  {
    title: "지역",
    dataIndex: "region_name",
    key: "region_name"
  },
  {
    title: "환자 수",
    dataIndex: "visit_count",
    key: "visit_count"
  },
  {
    title: "신규 환자 수",
    dataIndex: "sinhwan_count",
    key: "sinhwan_count"
  },
  {
    title: "재방문 환자 수",
    dataIndex: "chojin_rejin_count",
    key: "chojin_rejin_count"
  },
  {
    title: "누적 매출액",
    dataIndex: "total_cost",
    key: "total_cost"
  }
];

const BaseTable = ({ data }: { data: Region[] }) => {
  return (
    <TableContainer>
      <Table<Region>
        columns={columns}
        dataSource={data}
        scroll={{ x: "max-content" }}
        pagination={false}
        rowHoverable={false}
      />
    </TableContainer>
  );
};

export default BaseTable;

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
`;
