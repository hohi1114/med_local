import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import DashBoardTable from "../components/statics_by_region/table/DashBoardTable";
import useRegionAnalysis from "../hooks/useRegrionAnalysis";
import StatisticByRegionFilter from "../components/statics_by_region/StatisticByRegionFilter";

export default function StatisticsByRegionPage() {
  const {
    regionAnalysisData,
    isLoading,
    isRefetching,
    localSection,
    rangeDate,
    handleDateChange,
    handleLocalSectionChange
  } = useRegionAnalysis();
  return (
    <>
      <DashBoardContainer>
        <ContentHeader title="지역 별 통계" />
        <StatisticByRegionFilter
          rangeDate={rangeDate}
          handleDateChange={handleDateChange}
          locationSection={localSection}
          handleLocalSectionChange={handleLocalSectionChange}
        />
        <DashBoardTableContainer>
          <DashBoardTable
            data={regionAnalysisData}
            isLoading={isLoading}
            isRefetching={isRefetching}
          />
        </DashBoardTableContainer>
      </DashBoardContainer>
    </>
  );
}

const DashBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const DashBoardTableContainer = styled.div`
  padding: 1rem;
`;
