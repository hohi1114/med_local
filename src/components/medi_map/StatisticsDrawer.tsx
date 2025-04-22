import { Drawer, Tooltip } from "antd";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import RegionInfo from "./RegionInfo";
import RevenuInfo from "./chart/RevenueInfo";
import Loading from "../common/Loading";
import BaseToggle from "../common/toggle/BaseToggle";
import { useDrawerData } from "../../hooks/useDrawerData";
import {
  mockRegionInfo,
  mockMapByRegionStats,
  mockMapByRegionRegionPrivate
} from "../../utils/tutorial-mock";

dayjs.extend(isBetween);

const TOGGLEOPTION = ["지역", "매출", "전체"];
interface StatisticsDrawerProps {
  showTutorial: boolean;
}
const StatisticsDrawer = ({ showTutorial }: StatisticsDrawerProps) => {
  const { region, isOpenDrawer, handleIsDrawerOpen } = mapStore();
  const {
    regionInfo,
    statsData,
    regionPrivate,
    isPending,
    areaName,
    formatDataForAverageRevenue,
    formatDataForRevenueTrend,
    barFormatData
  } = useDrawerData(false);

  const areaNamDate = showTutorial ? mockRegionInfo.name : areaName;
  const regionInfoData = showTutorial ? mockRegionInfo : regionInfo;
  const statsDataData = showTutorial ? mockMapByRegionStats : statsData;
  const regionPrivateData = showTutorial
    ? mockMapByRegionRegionPrivate
    : regionPrivate;

  const [toggleValue, setToggleValue] = useState<string>(
    showTutorial ? "전체" : "매출"
  );

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isOpenDrawer && toggleValue === "전체" && showTutorial) {
      const timeout = setTimeout(() => {
        setShowTooltip(true);
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      setShowTooltip(false);
    }
  }, [isOpenDrawer, toggleValue, showTutorial]);

  const renderContent = () => {
    if (!regionInfo && !showTutorial) return null;
    if (toggleValue === "지역")
      return <RegionInfo data={regionInfoData} region={region} />;
    if (toggleValue === "매출") {
      return isPending ? (
        <Loading />
      ) : (
        <RevenuInfo
          statsData={statsDataData}
          avgGrowth={regionPrivateData?.growth_metrics}
          revenueTrend={regionPrivateData?.cost_by_date}
          dailyRevenue={regionPrivateData?.average_cost_per_visit_by_date}
          ageGroups={regionPrivateData?.patient_count_by_age_group}
          formatDataForRevenueTrend={() =>
            formatDataForRevenueTrend(regionPrivateData)
          }
          formatDataForAverageRevenue={() =>
            formatDataForAverageRevenue(regionPrivateData)
          }
          barFormatData={() => barFormatData(regionPrivateData)}
        />
      );
    }

    return isPending ? (
      <Loading />
    ) : (
      <div style={{ display: "flex", gap: "1rem" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <Tooltip
            title="클릭한 지역에 대한 의료와 관련된 정보를 제공합니다."
            open={showTooltip}
            placement="top"
            autoAdjustOverflow={false}
          >
            <SectionTitle>
              <span>지역 데이터</span>
            </SectionTitle>
          </Tooltip>
          <RegionInfo data={regionInfoData} region={region} />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <Tooltip
            title="해당 지역의 매출 정보를 제공하며 기준 기간과 비교한 증감 비율을 나타낸 데이터를 제공합니다."
            open={showTooltip}
            placement="top"
            autoAdjustOverflow={false}
          >
            <SectionTitle>매출 데이터</SectionTitle>
          </Tooltip>
          <RevenuInfo
            statsData={statsDataData}
            revenueTrend={regionPrivateData?.cost_by_date}
            dailyRevenue={regionPrivateData?.average_cost_per_visit_by_date}
            ageGroups={regionPrivateData?.patient_count_by_age_group}
            avgGrowth={regionPrivateData?.growth_metrics}
            formatDataForRevenueTrend={() =>
              formatDataForRevenueTrend(regionPrivateData)
            }
            formatDataForAverageRevenue={() =>
              formatDataForAverageRevenue(regionPrivateData)
            }
            barFormatData={() => barFormatData(regionPrivateData)}
          />
        </div>
      </div>
    );
  };

  return (
    <Drawer
      width={toggleValue === "전체" ? "70rem" : "39rem"}
      placement="right"
      onClose={() => handleIsDrawerOpen(false)}
      styles={{
        header: {
          padding: "0.8rem 1rem"
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0)", pointerEvents: "none" },
        body: {
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          backgroundColor: "#FFFFFF"
        }
      }}
      open={isOpenDrawer}
    >
      <ToggleContainer>
        <BaseToggle
          options={TOGGLEOPTION}
          selected={toggleValue}
          onChange={(val) => setToggleValue(val)}
        />
      </ToggleContainer>

      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaNamDate}</AddressTitleStyle>
      </div>
      {renderContent()}
    </Drawer>
  );
};

export default StatisticsDrawer;

const ToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

export const ChartTitleStyle = styled.span`
  font-size: 1.3rem;
  line-height: 5rem;
  margin-left: 1rem;
  font-weight: bold;
`;

export const GridWrapper = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

export const GraphContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const GrapWrapper = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 1rem;
`;

const SectionTitle = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.colors.black01};
  background-color: ${(props) => props.theme.colors.gray01};
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem 0rem;
`;
