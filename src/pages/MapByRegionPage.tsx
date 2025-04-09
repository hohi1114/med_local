import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import StatisticsDrawer from "../components/medi_map/StatisticsDrawer";
import mapStore from "../store/mapStore";
import useRangeDurationDatePicker from "../hooks/useRangeDurationDatePicker";
import RequireSubscribe from "../components/common/RequireSubscribe";
import userStore from "../store/userStore";
import { useNaverMapCore } from "../hooks/useNaverMapCore";
import styled from "styled-components";
import Loading from "../components/common/Loading";
import DurationDatePicker from "../components/common/datepicker/DurationDatePicker";
import { useNavigate } from "react-router-dom";
import useTutorial from "../hooks/useTutorial";
import Tutorial from "../components/tutorial/Tutorial";
import { MapByRegionTutorialSteps } from "../components/tutorial/TutorialData";
import { tutorialHighlightWithBlink } from "../styles/highlight";

function MapByRegionPage() {
  const tutorialRefs = {
    tutorialRef1: useRef(null)
  };
  const navigate = useNavigate();
  const tutorialSteps = MapByRegionTutorialSteps(tutorialRefs);
  const { mapElement, isFetching } = useNaverMapCore();
  const { isInActiveUser, lastedUpdatedDate } = userStore();
  const { loading, setDrawerDate, handleIsDrawerOpen } = mapStore();
  const { dateRange, handleDateRangeChange } = useRangeDurationDatePicker();

  const [showTutorial, setShowTutorial] = useState(true);
  const { tutorialStep, setTutorialStep, nextStep } = useTutorial({
    steps: tutorialRefs
  });

  useEffect(() => {
    return () => {
      handleIsDrawerOpen(false);
    };
  }, []);

  useEffect(() => {
    if (lastedUpdatedDate && lastedUpdatedDate.length > 0) {
      const start = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).subtract(1, "month").format("YYYY-MM-DD")
        : dayjs().subtract(1, "month").format("YYYY-MM-DD");
      const end = lastedUpdatedDate
        ? dayjs(lastedUpdatedDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      handleDateRangeChange({ startDate: start, endDate: end });
    }
  }, [lastedUpdatedDate]);

  useEffect(() => {
    if (dateRange) {
      setDrawerDate(dateRange);
    }
  }, [dateRange]);

  useEffect(() => {
    if (tutorialStep === 3) {
      handleIsDrawerOpen(true);
    }
  }, [tutorialStep]);

  return (
    <>
      {isInActiveUser && <RequireSubscribe />}
      {(isFetching || loading) && <Loading />}
      <MapContainer ref={mapElement}>
        <Wrapper>
          <ContentBox>
            <DatePickerContainer ref={tutorialRefs.tutorialRef1}>
              <DurationDatePicker
                style={{ width: "100%" }}
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </DatePickerContainer>
            <SubText>
              * Zoom In을 하면, 환자들이 온 지역의 수치를 확인할 수 있습니다.
            </SubText>
          </ContentBox>
        </Wrapper>
      </MapContainer>
      <StatisticsDrawer showTutorial={showTutorial} />
      {tutorialSteps[tutorialStep].specialBackground && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 80,
            cursor: "pointer",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <img
            onClick={() => {
              handleIsDrawerOpen(true);
              nextStep();
            }}
            src={"/images/MapByRegionTutorialMap.png"}
            alt="MapByRegionTutorialMap"
          />
        </div>
      )}
      <Tutorial
        steps={tutorialSteps}
        tutorialStep={tutorialStep}
        setTutorialStep={setTutorialStep}
        onComplete={() => navigate("/update_data")}
        showTutorial={showTutorial}
      />
    </>
  );
}

export default MapByRegionPage;

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const Wrapper = styled.div`
  position: absolute;
  top: 1rem;
  left: 4rem;
  z-index: 90;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
`;

const ContentBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
`;

const DatePickerContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;

  &.tutorial-highlight {
    ${tutorialHighlightWithBlink}
  }
`;

const SubText = styled.span`
  font-size: 1rem;
  color: ${(props) => props.theme.colors.gray05};
`;
