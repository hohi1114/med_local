import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import DashBoardFilter from "../components/common/dashboard/DashBoardFilter";
import DashBoardTable from "../components/common/dashboard/table/DashBoardTable";

export default function StatisticsByRegionPage() {
  return (
    <DashBoardContainer>
      <ContentHeader title="지역 별 통계" />
      <DashBoardFilter />
      <DashBoardTable />
    </DashBoardContainer>
  );
}
const DashBoardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;
