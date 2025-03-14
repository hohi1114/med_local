import { Table } from "antd";
import type { TableProps } from "antd";
import styled from "styled-components";

interface DataType {
  key: string;
  area: string;
  patientCount: number;
  revenueRate: string;
  accumulatedRevenue: number;
}

const columns: TableProps<DataType>["columns"] = [
  {
    title: "지역",
    dataIndex: "area",
    key: "area"
  },
  {
    title: "환자수",
    dataIndex: "patientCount",
    key: "patientCount"
  },
  {
    title: "매출비율",
    dataIndex: "revenueRate",
    key: "revenueRate"
  },
  {
    title: "누적 매출액",
    dataIndex: "accumulatedRevenue",
    key: "accumulatedRevenue"
  }
];

const data: DataType[] = [
  {
    key: "1",
    area: "John Brown",
    patientCount: 32,
    revenueRate: "New York No. 1 Lake Park",
    accumulatedRevenue: 44
  },
  {
    key: "3",
    area: "John Brown",
    patientCount: 32,
    revenueRate: "New York No. 1 Lake Park",
    accumulatedRevenue: 44
  },
  {
    key: "4",
    area: "John Brown",
    patientCount: 32,
    revenueRate: "New York No. 1 Lake Park",
    accumulatedRevenue: 44
  }
];

const BaseTable = () => {
  return (
    <TableContainer>
      <Table<DataType>
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
