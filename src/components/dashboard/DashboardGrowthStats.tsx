import styled from "styled-components";
import { DashBoard } from "../../types/dashboard";

export default function DashboardGrowthStats({
  dashboardInfo
}: {
  dashboardInfo: DashBoard;
}) {
  if (!dashboardInfo?.average_growths?.data_available) {
    return <NoDataContainer>불러올 데이터가 없습니다.</NoDataContainer>;
  }

  return (
    <Container>
      <GrowthCardContainer>
        <StatComment>
          최근 3개월 동안의 진료 데이터를 분석한 결과 :
          <StatList>
            <li>
              총 진료비는 평균적으로{" "}
              <ChangeWithIcon
                value={dashboardInfo?.average_growths?.avg_growth_total_cost!}
              />
              하였습니다.
            </li>
            <li>
              신환 유입은{" "}
              <ChangeWithIcon
                value={dashboardInfo?.average_growths?.avg_growth_sinhwan!}
              />
              하였습니다.
            </li>
            <li>
              재방문 환자는{" "}
              <ChangeWithIcon
                value={dashboardInfo?.average_growths?.avg_growth_revisit!}
              />
              하였습니다.
            </li>
          </StatList>
        </StatComment>
      </GrowthCardContainer>
      <GrowthCardContainer>
        <StatComment>
          최근 3개월동안 가장 변화율이 큰 나이대는 :
          <StatList>
            <li>
              <strong>
                {dashboardInfo?.average_growths.top_age_growth[0].age}대
              </strong>{" "}
              이며
              <br />
              <ChangeWithIcon
                value={
                  dashboardInfo?.average_growths.top_age_growth[0]
                    .change_percent!
                }
              />
              하였습니다.
            </li>
            <li>
              <strong>
                {dashboardInfo?.average_growths.top_age_growth[1]?.age}대
              </strong>{" "}
              이며 <br />
              <ChangeWithIcon
                value={
                  dashboardInfo?.average_growths.top_age_growth[1]
                    .change_percent!
                }
              />
              하였습니다.
            </li>
          </StatList>
        </StatComment>
      </GrowthCardContainer>
    </Container>
  );
}

const ChangeWithIcon = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
    >
      <img
        src={isPositive ? "/images/arrow_up.svg" : "/images/arrow_down.svg"}
        alt={isPositive ? "increase" : "decrease"}
        style={{ width: "1rem", height: "1rem" }}
      />
      <strong style={{ color: isPositive ? "#30bf78" : "#EF4261" }}>
        {value}%
      </strong>
      <strong>{isPositive ? "증가" : "감소"}</strong>
    </span>
  );
};

const Container = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NoDataContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.gray05};
`;

const StatComment = styled.div`
  font-size: 1.3rem;
  line-height: 1.6;
  color: ${(props) => props.theme.colors.black01};
  text-align: left;
  padding: 1rem;
`;

const StatList = styled.ul`
  list-style-type: disc;
  color: ${(props) => props.theme.colors.black01};

  li {
    margin-bottom: 0.5rem;
  }
`;

const GrowthCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  padding: 1rem;
  gap: 0.5rem;
  border: 1px solid ${(props) => props.theme.colors.gray02};
`;
