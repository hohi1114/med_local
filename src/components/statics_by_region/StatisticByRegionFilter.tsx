import { FC } from "react";
import styled from "styled-components";
import { Select } from "antd";
import DurationDatePicker from "../common/datepicker/DurationDatePicker";
import { DateRange } from "../../hooks/useRangeDurationDatePicker";
import { LOCAL_SECTIONS_MAP } from "../../hooks/useRegionAnalysis";
import { useRegionAnalysisStore } from "../../store/useRegionAnalysisStore";
import StatisticByRegionSearch from "./StatisticByRegionSearch";

interface StatisticByRegionFilterProps {
  isTutorial?: boolean;
  rangeDate: DateRange;
  handleDateChange: (dates: DateRange) => void;
  handleLocalSectionChange: (value: keyof typeof LOCAL_SECTIONS_MAP) => void;
}
const StatisticByRegionFilter: FC<StatisticByRegionFilterProps> = (props) => {
  const { isTutorial, rangeDate, handleDateChange, handleLocalSectionChange } =
    props;
  const { localSection } = useRegionAnalysisStore();

  return (
    <FilterWrapper isTutorial={isTutorial}>
      {/* Left Filter Section */}
      <FilterContainer>
        <FilterItemContainer>
          <span className="title">분석기간</span>
          <DurationDatePicker
            value={rangeDate}
            onChange={(date) => {
              handleDateChange(date);
            }}
          />
        </FilterItemContainer>
        <FilterItemContainer>
          <span className="title">지역 단위</span>
          <Select
            onChange={handleLocalSectionChange}
            defaultValue={localSection}
          >
            {Object.keys(LOCAL_SECTIONS_MAP).map((section, index) => {
              return (
                <Select.Option key={index} value={section}>
                  {section}
                </Select.Option>
              );
            })}
          </Select>
        </FilterItemContainer>
      </FilterContainer>

      {/* Right Filter Section */}
      <StatisticByRegionSearch />
    </FilterWrapper>
  );
};

export default StatisticByRegionFilter;

const FilterWrapper = styled.div<{ isTutorial?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: ${(props) => props.theme.colors.white01};
  z-index: ${(props) => (props.isTutorial ? "100" : "auto")};
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1.7rem;
`;

const FilterItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  .title {
    font-weight: bold;
  }
`;
