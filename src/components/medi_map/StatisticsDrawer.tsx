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
} from "../../utils/\bTutorialMock";

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
    showTutorial ? "전체" : "지역"
  );

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isOpenDrawer && toggleValue === "전체") {
      const timeout = setTimeout(() => {
        setShowTooltip(true);
      }, 300);

      return () => clearTimeout(timeout);
    } else {
      setShowTooltip(false);
    }
  }, [isOpenDrawer, toggleValue]);

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
            <div
              style={{
                textAlign: "center",
                padding: "0.5rem 1rem",
                backgroundColor: "#f0f2f5"
              }}
            >
              <ChartTitleStyle>지역 데이터</ChartTitleStyle>
            </div>
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
            <div
              style={{
                textAlign: "center",
                padding: "0.5rem 1rem",
                backgroundColor: "#f0f2f5"
              }}
            >
              <ChartTitleStyle>매출 데이터</ChartTitleStyle>
            </div>
          </Tooltip>
          <RevenuInfo
            statsData={statsDataData}
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
  font-size: 1.2rem;
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
  gap: 1rem;
`;

export const GrapWrapper = styled.div`
  background-color: ${(props) => props.theme.colors.white};
  border-radius: 1rem;
  padding: 2rem 1rem 0rem 1rem;
`;
