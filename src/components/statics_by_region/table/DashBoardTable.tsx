import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { useEffect } from "react";
import styled from "styled-components";
import useMediData from "../../../hooks/useMediData";

const columns: TableColumnsType<MediDataType> = [
  {
    title: "지역",
    dataIndex: "address",
  },
  // {
  //   title: "유동인구 수",
  //   dataIndex: "people_of_movement",
  //   sorter: (a, b) => a.people_of_movement - b.people_of_movement,
  // },
  // {
  //   title: "방문 환자 수",
  //   dataIndex: "visiting_patients",
  //   sorter: (a, b) => a.visiting_patients - b.visiting_patients,
  // },
  // {
  //   title: "환자 평균 연령",
  //   dataIndex: "average_age_of_patients",
  //   sorter: (a, b) => a.average_age_of_patients - b.average_age_of_patients,
  // },
  // {
  //   title: "초진 환자 수",
  //   dataIndex: "new_patients",
  //   sorter: (a, b) => a.new_patients - b.new_patients,
  // },
  // {
  //   title: "재진 환자 수",
  //   dataIndex: "revisiting_patients",
  //   sorter: (a, b) => a.revisiting_patients - b.revisiting_patients,
  // },
  // {
  //   title: "유입 비율",
  //   dataIndex: "inflow_rate",
  //   sorter: (a, b) => a.inflow_rate - b.inflow_rate,
  // },
  // {
  //   title: "1인당 평균 매출액",
  //   dataIndex: "average_sales_per_person",
  //   sorter: (a, b) => a.average_sales_per_person - b.average_sales_per_person,
  // },
  // {
  //   title: "매출 비율",
  //   dataIndex: "sales_rate",
  //   sorter: (a, b) => a.sales_rate - b.sales_rate,
  // },
  // {
  //   title: "누적 매출액",
  //   dataIndex: "accumulated_sales",
  //   sorter: (a, b) => a.accumulated_sales - b.accumulated_sales,
  // },
];

const DashBoardTable = () => {
  const { mediData, loading } = useMediData();

  useEffect(() => {
    if (!loading) {
      console.log(mediData);
    }
  }, [loading]);

  return (
    <DashBoardTableContainer
      columns={columns}
      dataSource={mediData}
      pagination={{
        position: ["bottomCenter"],
      }}
      scroll={{ x: "max-content" }}
    />
  );
};

export default DashBoardTable;

const DashBoardTableContainer = styled(Table)<TableProps<DataType>>`
  .ant-table {
    background-color: #ffffff;
    font-size: 1rem;
  }

  .ant-table-thead > tr > th {
    background-color: #ffffff;
  }
`;
