import { Table } from "antd";
import { FC, useEffect } from "react";
import styled from "styled-components";
import { RegionStatistics } from "../../../types/region-analysis";
import { TableProps } from "antd/es/table";
import { useRegionAnalysisStore } from "../../../store/useRegionAnalysisStore";
import { statisticsColumn } from "./StatisticsTableData";
import { mockStatisticsByRegion } from "../../../utils/tutorial-mock";
import userStore from "../../../store/userStore";

interface DashBoardTableProps {
  isLoading: boolean;
  isTutorial?: boolean;
}

interface CustomTableProps extends TableProps<RegionStatistics> {
  isTutorial?: boolean;
  highlightColumn?: boolean;
}

const StatisticsTable: FC<DashBoardTableProps> = ({
  isLoading,
  isTutorial
}) => {
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

  const { startTutorial } = userStore();

  useEffect(() => {
    const dataMap = {
      소구역: startTutorial ? mockStatisticsByRegion : smallSectionData,
      동: dongSectionData,
      구: guSectionData
    };
    setData(dataMap[localSection]);
  }, [
    localSection,
    smallSectionData,
    dongSectionData,
    guSectionData,
    startTutorial
  ]);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  return (
    <DashBoardTableContainer
      isTutorial={isTutorial}
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

const DashBoardTableContainer = styled(Table)<CustomTableProps>`
  .ant-table {
    background-color: ${(props) => props.theme.colors.white};
    font-size: 1rem;
  }
  .ant-table-thead {
    position: relative;
    z-index: ${(props) => (props.isTutorial ? "100" : "auto")};
  }

  .ant-table-thead > tr > th {
    background-color: ${(props) => props.theme.colors.white};
  }

  .ant-table-column-sorter-up,
  .ant-table-column-sorter-down {
    color: ${(props) =>
      props.isTutorial
        ? props.theme.colors.primary
        : props.theme.colors.gray03};
  }
`;
