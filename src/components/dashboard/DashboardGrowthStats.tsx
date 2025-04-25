import styled from "styled-components";
import dayjs from "dayjs";
import { Tooltip } from "antd";
import { AverageGrowth, TopAgeGrowth } from "../../types/dashboard";
import userStore from "../../store/userStore";
import {
  getGrowthAgeMessage,
  getGrowthMessage,
  needNotify
} from "../medi_map/util/mapUtil";
import { ReactNode } from "react";
import { TooltipPlacement } from "antd/es/tooltip";

// 재사용 가능한 컴포넌트들
const ChangeIndicator = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <ChangeWrapper>
      <ChangeIcon
        src={isPositive ? "/images/arrow_up.svg" : "/images/arrow_down.svg"}
        alt={isPositive ? "increase" : "decrease"}
      />
      <ChangeValue isPositive={isPositive}>{value}%</ChangeValue>
      {isPositive ? "증가" : "감소"}
    </ChangeWrapper>
  );
};

const InfoTooltip = ({
  content,
  placement
}: {
  content: ReactNode;
  placement?: string;
}) => (
  <TooltipIcon>
    <Tooltip
      placement={(placement ?? "top") as TooltipPlacement}
      color="white"
      title={<TooltipContent>{content}</TooltipContent>}
    >
      <span>?</span>
    </Tooltip>
  </TooltipIcon>
);

// 메인 컴포넌트
export default function DashboardGrowthStats({
  data,
  isDashboard = false,
  costRank
}: {
  data: AverageGrowth;
  isDashboard?: boolean;
  costRank?: number;
}) {
  const { lastedUpdatedDate } = userStore();

  if (!data?.data_available || !data) {
    return <NoDataContainer>불러올 데이터가 없습니다.</NoDataContainer>;
  }

  const startDate = dayjs(lastedUpdatedDate)
    .subtract(3, "month")
    .subtract(2, "day")
    .format("YYYY.MM.DD");
  const endDate = dayjs(lastedUpdatedDate).format("YYYY.MM.DD");

  // 툴팁에 표시될 내용
  const overallTooltipContent = (
    <>
      <span>
        <strong>진료비</strong> -{" "}
        <ChangeIndicator value={data?.avg_growth_total_cost ?? 0} />
      </span>
      <br />
      <span>
        <strong>신규환자 유입</strong> -{" "}
        <ChangeIndicator value={data?.avg_growth_sinhwan ?? 0} />
      </span>
      <br />
      <span>
        <strong>재방문 환자</strong> -{" "}
        <ChangeIndicator value={data?.avg_growth_revisit ?? 0} />
      </span>
    </>
  );

  const ageGroupTooltipContent = (
    <>
      {data.top_age_growth.map((ageGroup: TopAgeGrowth, index: number) => {
        if (ageGroup.change_percent === 0) return null;

        return (
          <div key={index}>
            <span>
              <strong>{ageGroup.age === 0 ? "0~10" : ageGroup.age}대</strong>
              {"    "}-{"   "}
              <ChangeIndicator value={ageGroup.change_percent} />
            </span>
          </div>
        );
      })}
    </>
  );
  if (isDashboard) {
    return (
      <DashboardContainer>
        <GrowthCard>
          <StatComment>
            [ {startDate} ~ {endDate} ]
            <StatList2>
              <div>
                <ListItem>{getGrowthMessage(data)}</ListItem>
                <StatText>
                  총 진료비는 평균적으로{" "}
                  <ChangeIndicator value={data?.avg_growth_total_cost ?? 0} />{" "}
                  했어요.
                </StatText>
                <StatText>
                  신규 환자 유입은{" "}
                  <ChangeIndicator value={data?.avg_growth_sinhwan ?? 0} />{" "}
                  했어요.
                </StatText>
                <StatText>
                  재방문 환자는{" "}
                  <ChangeIndicator value={data?.avg_growth_revisit ?? 0} />{" "}
                  하였습니다.
                </StatText>
              </div>
            </StatList2>
          </StatComment>
        </GrowthCard>

        <GrowthCard>
          <StatComment>
            [ 변화율 TOP 2 연령대 ]
            <StatList2>
              {data.top_age_growth.map((ageGroup) => {
                if (ageGroup.change_percent === 0) return null;
                const message = getGrowthAgeMessage(
                  ageGroup.age,
                  ageGroup.change_percent
                );
                return (
                  <div key={ageGroup.age}>
                    <StrongText alert="none">
                      {message.strategyMessage}
                    </StrongText>
                    <StatText>
                      <strong>
                        {ageGroup.age === 0 ? "0~10" : ageGroup.age}대
                      </strong>{" "}
                      비율이 <ChangeIndicator value={ageGroup.change_percent} />{" "}
                      했어요.
                    </StatText>
                  </div>
                );
              })}
            </StatList2>
          </StatComment>
        </GrowthCard>
      </DashboardContainer>
    );
  }

  return (
    <Container>
      <CardContent>
        <HeaderRow>
          <DateRange>
            [ {startDate} ~ {endDate} ]
          </DateRange>
          <InfoTooltip content={overallTooltipContent} />
        </HeaderRow>

        <StatList>
          <StatItem>
            <StrongText alert={needNotify(costRank ?? 0, data)}>
              {getGrowthMessage(data)}
            </StrongText>
          </StatItem>
        </StatList>
      </CardContent>

      <CardContent>
        <HeaderRow>
          <DateRange>[ 변화율 TOP 2 연령대 ]</DateRange>
          <InfoTooltip content={ageGroupTooltipContent} placement="right" />
        </HeaderRow>

        <StatList>
          {data.top_age_growth.map((ageGroup: TopAgeGrowth) => {
            if (ageGroup.change_percent === 0) return null;
            const message = getGrowthAgeMessage(
              ageGroup.age,
              ageGroup.change_percent
            );
            return (
              <StatItem key={ageGroup.age}>
                <StrongText alert="none">{message.strategyMessage}</StrongText>
                <StatText>{message.summaryMessage}</StatText>
              </StatItem>
            );
          })}
        </StatList>
      </CardContent>
    </Container>
  );
}

const DashboardContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GrowthCard = styled.div``;

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const CardContent = styled.div`
  padding: 1rem 1rem;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const DateRange = styled.span`
  color: ${(props) => props.theme.colors.gray05};
  font-size: 1.1rem;
  line-height: 1.8rem;
`;

const StatComment = styled.div`
  font-size: 1.2rem;
  color: ${(props) => props.theme.colors.gray05};
  text-align: left;
  padding: 1.5rem;
`;

const StatText = styled.span`
  color: ${(props) => props.theme.colors.gray05};
  font-size: 1.2rem;
  display: block;
`;

const TooltipIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background-color: ${(props) => props.theme.colors.gray03};
  color: ${(props) => props.theme.colors.white};
`;

const TooltipContent = styled.div`
  color: ${(props) => props.theme.colors.black01};
  padding: 0.75rem;
`;

const StatList = styled.div`
  margin-top: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const StatList2 = styled.ul`
  list-style-type: none;
  margin: 0;
  margin-top: 1rem;
  padding: 0;
  color: ${(props) => props.theme.colors.black01};
  display: flex;
  flex-direction: column;
  gap: 1rem;

  div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ListItem = styled.li`
  font-weight: 600;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
`;

const StrongText = styled.div<{ alert?: string }>`
  font-weight: 600;
  font-size: 1.3rem;
  line-height: 2rem;
  white-space: pre-line;
  color: ${(props) =>
    props?.alert === "none"
      ? props.theme.colors.black01
      : props?.alert === "bad"
        ? props.theme.colors.red
        : props.theme.colors.macGreen};
`;

const NoDataContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
  font-size: 1.1rem;
  color: ${(props) => props.theme.colors.gray05};
`;

const ChangeWrapper = styled.span`
  display: inline-flex;
  gap: 0.3rem;
  align-items: baseline;
`;

const ChangeIcon = styled.img`
  width: 1rem;
  height: 1rem;
`;

const ChangeValue = styled.strong<{ isPositive: boolean }>`
  color: ${(props) =>
    props.isPositive ? props.theme.colors.green03 : props.theme.colors.red};
`;
