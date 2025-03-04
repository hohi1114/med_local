import styled from "styled-components";
import ContentHeader from "../components/common/layout/ContentHeader";

export default function DashBoardPage() {
  return (
    <DashBoardContainer>
      <ContentHeader title="대시보드" />
    </DashBoardContainer>
  );
}
const DashBoardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;
