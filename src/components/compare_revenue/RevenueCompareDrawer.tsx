import { Drawer } from "antd";
import styled from "styled-components";
import mapStore from "../../store/mapStore";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import Loading from "../common/Loading";
import RevenuInfo from "../medi_map/chart/RevenueInfo";
import { useDrawerData } from "../../hooks/useDrawerData";
dayjs.extend(isBetween);

const RevenueCompareDrawer = () => {
  const { isOpenDrawer, drawerDate1, drawerDate2, handleIsDrawerOpen } =
    mapStore();
  const {
    firstRegionPrivate,
    secondRegionPrivate,
    isPending,
    areaName,
    formatDataForAverageRevenue,
    formatDataForRevenueTrend,
    barFormatData,
    comparisonStatsData
  } = useDrawerData(true);

  const renderContent = () => {
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
          <div
            style={{
              textAlign: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f2f5"
            }}
          >
            <TitleContainer>
              <span>기준 기간</span>
              <span>
                {dayjs(drawerDate1?.startDate).format("YYYY-MM-DD") +
                  " ~ " +
                  dayjs(drawerDate1?.endDate).format("YYYY-MM-DD")}
              </span>
            </TitleContainer>
          </div>
          <RevenuInfo
            disabledCompare={true}
            statsData={comparisonStatsData?.first}
            revenueTrend={firstRegionPrivate?.cost_by_date}
            dailyRevenue={firstRegionPrivate?.average_cost_per_visit_by_date}
            ageGroups={firstRegionPrivate?.patient_count_by_age_group}
            formatDataForRevenueTrend={() =>
              formatDataForRevenueTrend(firstRegionPrivate)
            }
            formatDataForAverageRevenue={() =>
              formatDataForAverageRevenue(firstRegionPrivate)
            }
            barFormatData={() => barFormatData(firstRegionPrivate)}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f2f5"
            }}
          >
            <TitleContainer>
              <span>비교 기간</span>
              <span>
                {dayjs(drawerDate2?.startDate).format("YYYY-MM-DD") +
                  " ~ " +
                  dayjs(drawerDate2?.endDate).format("YYYY-MM-DD")}
              </span>
            </TitleContainer>
          </div>

          <RevenuInfo
            statsData={comparisonStatsData?.second}
            revenueTrend={secondRegionPrivate?.cost_by_date}
            dailyRevenue={secondRegionPrivate?.average_cost_per_visit_by_date}
            ageGroups={secondRegionPrivate?.patient_count_by_age_group}
            formatDataForRevenueTrend={() =>
              formatDataForRevenueTrend(secondRegionPrivate)
            }
            formatDataForAverageRevenue={() =>
              formatDataForAverageRevenue(secondRegionPrivate)
            }
            barFormatData={() => barFormatData(secondRegionPrivate)}
          />
        </div>
      </div>
    );
  };

  return (
    <Drawer
      width={"70rem"}
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
      <div style={{ padding: "0.8rem 0rem" }}>
        <AddressTitleStyle>{areaName}</AddressTitleStyle>
      </div>
      {renderContent()}
    </Drawer>
  );
};

export default RevenueCompareDrawer;

const AddressTitleStyle = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
`;

export const TitleContainer = styled.div`
  font-size: 1.2rem;
  margin-left: 1rem;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
