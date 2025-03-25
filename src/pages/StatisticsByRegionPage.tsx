import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import DashBoardTable from "../components/statics_by_region/table/DashBoardTable";
import useRegionAnalysis from "../hooks/useRegionAnalysis";
import StatisticByRegionFilter from "../components/statics_by_region/StatisticByRegionFilter";

export default function StatisticsByRegionPage() {
  const {
    isLoading,
    rangeDate,
    isError,
    error,
    handleDateChange,
    handleLocalSectionChange
  } = useRegionAnalysis();

  if (isError) return <div>{error?.message}</div>;
  return (
    <>
      <ContentHeader title="지역 별 통계" />
      <DashBoardContainer>
        <StatisticByRegionFilter
          rangeDate={rangeDate}
          handleDateChange={handleDateChange}
          handleLocalSectionChange={handleLocalSectionChange}
        />
        <DashBoardTableContainer>
          <DashBoardTable isLoading={isLoading} />
        </DashBoardTableContainer>
      </DashBoardContainer>
    </>
  );
}

const DashBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const DashBoardTableContainer = styled.div`
  padding: 1rem;
`;
