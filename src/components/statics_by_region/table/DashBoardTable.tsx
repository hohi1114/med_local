import { Table } from "antd";
import type { TableColumnsType, TableProps } from "antd";
import { useEffect } from "react";
import styled from "styled-components";
import useMediData from "../../../hooks/useMediData";

const DashBoardTable = () => {
  const { mediData, loading } = useMediData();

  return (
    <></>
    // <DashBoardTableContainer
    //   columns={}
    //   dataSource={mediData}
    //   pagination={{
    //     position: ["bottomCenter"]
    //   }}
    //   scroll={{ x: "max-content" }}
    // />
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
