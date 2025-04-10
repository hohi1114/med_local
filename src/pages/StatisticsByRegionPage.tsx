import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import useRegionAnalysis from "../hooks/useRegionAnalysis";
import StatisticByRegionFilter from "../components/statics_by_region/StatisticByRegionFilter";
import Error from "../components/common/Error";
import StatisticsTable from "../components/statics_by_region/table/StatisticsTable";
import RequireSubscribe from "../components/common/RequireSubscribe";
import userStore from "../store/userStore";
import {
  CloseGuideButton,
  FullDimOverlay,
  GuideDescription
} from "../components/tutorial/style/tutorial.styles";
import { useNavigate } from "react-router-dom";

export default function StatisticsByRegionPage() {
  const { isInActiveUser, startTutorial, setStartTutorial } = userStore();
  const navigate = useNavigate();
  const {
    isPending,
    dateRange,
    isError,
    error,
    handleLocalSectionChange,
    handleDateRangeChange
  } = useRegionAnalysis();

  if (isError) return <Error message={error?.message} />;

  const handleTutorialButton = () => {
    setStartTutorial(false);
    navigate("/");
  };

  return (
    <>
      {startTutorial && <FullDimOverlay />}
      <RequireSubscribe />
      <ContentHeader title="지역 별 통계" />
      <DashBoardContainer>
        {startTutorial && (
          <CloseGuideButton type="button" onClick={handleTutorialButton}>
            가이드 마치기
          </CloseGuideButton>
        )}
        {startTutorial && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GuideDescription>
              기본 날짜는 <b>최근 업데이트일 기준으로 1개월 전</b>이며, 지역은{" "}
              <b>소구역, 군, 구</b> 단위로 자유롭게 선택할 수 있어요.
            </GuideDescription>
          </div>
        )}

        <StatisticByRegionFilter
          isTutorial={startTutorial}
          rangeDate={dateRange}
          handleDateChange={handleDateRangeChange}
          handleLocalSectionChange={handleLocalSectionChange}
        />

        <DashBoardTableContainer>
          {startTutorial && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <GuideDescription>
                각 컬럼은 클릭하면 <b>오름차순 혹은 내림차순</b>으로 정렬할 수
                있어요.
              </GuideDescription>
            </div>
          )}
          <StatisticsTable isLoading={isPending} isTutorial={startTutorial} />
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
