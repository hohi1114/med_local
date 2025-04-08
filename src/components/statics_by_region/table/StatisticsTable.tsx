import { Table } from "antd";
import { FC, useEffect } from "react";
import styled from "styled-components";
import { RegionStatistics } from "../../../types/region-analysis";
import { TableProps } from "antd/es/table";
import { useRegionAnalysisStore } from "../../../store/useRegionAnalysisStore";
import { statisticsColumn } from "./StatisticsTableData";

interface DashBoardTableProps {
  isLoading: boolean;
}

const StatisticsTable: FC<DashBoardTableProps> = ({ isLoading }) => {
  const {
    smallSectionData,
    dongSectionData,
    guSectionData,
    localSection,
    filteredData,
    setFilteredData,
    setData,
    data
  } = useRegionAnalysisStore();

  useEffect(() => {
    const dataMap = {
      소구역: smallSectionData,
      동: dongSectionData,
      구: guSectionData
    };
    setData(dataMap[localSection]);
  }, [localSection, smallSectionData, dongSectionData, guSectionData]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  return (
    <DashBoardTableContainer
      columns={statisticsColumn}
      loading={isLoading}
      dataSource={filteredData}
      pagination={{
        position: ["bottomCenter"]
      }}
      scroll={{ x: 1200 }}
      rowKey="region_name"
    />
  );
};

export default StatisticsTable;

const DashBoardTableContainer = styled(Table)<TableProps<RegionStatistics>>`
  .ant-table {
    background-color: ${(props) => props.theme.colors.white};
    font-size: 1rem;
  }

  .ant-table-thead > tr > th {
    background-color: ${(props) => props.theme.colors.white};
  }
`;
