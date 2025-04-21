import styled from "styled-components";
import { AverageGrowth } from "../../types/dashboard";
import userStore from "../../store/userStore";
import dayjs from "dayjs";

export default function DashboardGrowthStats({
  data,
  isDashboard = false
}: {
  data: AverageGrowth;
  isDashboard?: boolean;
}) {
  const { lastedUpdatedDate } = userStore();
  if (!data?.data_available || !data) {
    return <NoDataContainer>불러올 데이터가 없습니다.</NoDataContainer>;
  }

  return (
    <Container>
      <GrowthCardContainer>
        <StatComment isDashboard={isDashboard}>
          [{dayjs(lastedUpdatedDate).subtract(3, "month").format("YYYY.MM.DD")}
          {" ~ "}
          {dayjs(lastedUpdatedDate).format("YYYY.MM.DD")}]
          <StatList>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              <ListItem>
                매출, 신환, 재진이 모두 긍정적인 추이를 보이고 있어요.
              </ListItem>
              <span style={{ color: "gray" }}>
                총 진료비는 평균적으로{" "}
                <ChangeWithIcon value={data?.avg_growth_total_cost!} />
                했어요.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              <ListItem>
                매출 추이는 좋으나, 신환이 감소하는 추세에요. 신규 환자 유입에
                신경써보시는 건 어떨까요?
              </ListItem>
              <span style={{ color: "gray" }}>
                신환 유입은 <ChangeWithIcon value={data?.avg_growth_sinhwan!} />
                했어요.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem"
              }}
            >
              <ListItem>
                매출 추이는 좋으나 신환 유입, 재진율 상승에 신경 써보시는 건
                어떨까요? (객단가 이야기 해야 하나?)
              </ListItem>
              <span style={{ color: "gray" }}>
                재방문 환자는{" "}
                <ChangeWithIcon value={data?.avg_growth_revisit!} />
                하였습니다.
              </span>
            </div>
          </StatList>
        </StatComment>
      </GrowthCardContainer>
      <GrowthCardContainer>
        <StatComment isDashboard={isDashboard}>
          [ 나이대 변화율 ]
          <StatList>
            {data.top_age_growth.map((ageGroup, index) => (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <ListItem>
                  매출 추이는 좋으나 신환 유입, 재진율 상승에 신경 써보시는 건
                  어떨까요? (객단가 이야기 해야 하나?)
                </ListItem>
                <span style={{ color: "gray" }}>
                  <strong>{ageGroup.age}대</strong> 이며{" "}
                  <ChangeWithIcon value={ageGroup.change_percent!} />
                  했어요.
                </span>
              </div>
            ))}
          </StatList>
        </StatComment>
      </GrowthCardContainer>
    </Container>
  );
}

const ChangeWithIcon = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <>
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
        {isPositive ? "증가" : "감소"}
      </span>
    </>
  );
};

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 0.3rem;
`;

const NoDataContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.gray05};
`;

const StatComment = styled.div<{ isDashboard: boolean }>`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray05};
  text-align: left;
  padding: 1rem;
  border-radius: 1rem;
`;

const StatList = styled.ul`
  list-style-type: none;
  margin: 0;
  margin-top: 1rem;
  padding: 0;
  color: ${(props) => props.theme.colors.black01};
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const ListItem = styled.li`
  font-weight: 600;
  font-size: 1.3rem;
`;

const GrowthCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
