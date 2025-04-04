import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import useRegionAnalysis from "../hooks/useRegionAnalysis";
import StatisticByRegionFilter from "../components/statics_by_region/StatisticByRegionFilter";
import Error from "../components/common/Error";
import StatisticsTable from "../components/statics_by_region/table/StatisticsTable";
import RequireSubscribe from "../components/common/RequireSubscribe";
import userStore from "../store/userStore";

export default function StatisticsByRegionPage() {
  const { isInActiveUser } = userStore();
  const {
    isPending,
    dateRange,
    isError,
    error,
    handleLocalSectionChange,
    handleDateRangeChange
  } = useRegionAnalysis();

  if (isError) return <Error message={error?.message} />;
  return (
    <>
      {isInActiveUser && <RequireSubscribe />}
      <ContentHeader title="지역 별 통계" />
      <DashBoardContainer>
        <StatisticByRegionFilter
          rangeDate={dateRange}
          handleDateChange={handleDateRangeChange}
          handleLocalSectionChange={handleLocalSectionChange}
        />
        <DashBoardTableContainer>
          <StatisticsTable isLoading={isPending} />
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
