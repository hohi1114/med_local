import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";
import DashBoardFilter from "../components/statics_by_region/DashBoardFilter";
import DashBoardTable from "../components/statics_by_region/table/DashBoardTable";

export default function StatisticsByRegionPage() {
  return (
    <DashBoardContainer>
      <ContentHeader title="지역 별 통계" />
      <DashBoardFilter />
      <DashBoardTableContainer>
        <DashBoardTable />
      </DashBoardTableContainer>
    </DashBoardContainer>
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
