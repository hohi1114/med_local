import { useEffect, useState } from "react";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { PatientData } from "../utils/ExcelParser";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { getAllPatients } from "../store/indexded_db/RegionDB";
import { AllPatientsData, RankedRegion } from "../types/medi-types";
dayjs.extend(isBetween);
import { dashboardMock } from "../assets/DashboardMock.js";

const useDashBoard = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const [patientsData, setPatientsData] = useState<PatientData[]>([]);
  const [filteredpatients, setFilteredPatients] = useState<PatientData[]>([]);
  const [rankedRegion, setRankedRegion] = useState<RankedRegion[]>([]);
  const [regionAllPatients, setRegionAllPatients] = useState<AllPatientsData[]>(
    []
  );
  const [totalCost, setTotalCost] = useState<{ past: number; current: number }>(
    0
  );
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalNewPatients, setTotalNewPatients] = useState<number>(0);
  const [totalRevisitedPatitents, setTotalRevisitedPatients] =
    useState<number>(0);
  const [averageAge, setAverageAge] = useState<Record<string, number>>({});
  const [revenueByDate, setrevenueByDate] = useState<Record<string, number>>(
    {}
  );
  const [filteredPastPatients, setFilteredPastPatients] = useState<
    PatientData[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      // const data: PatientData[] = await getAllMergedData();
      const data = await dashboardMock();
      // const allPatientsData: AllPatientsData[] = await getAllPatients("small");
      if (data) {
        setPatientsData(data);
        setFilteredPatients(data);
      }
      // if (allPatientsData) {
      //   setRegionAllPatients(allPatientsData);
      // }
    };
    fetchData();
    handleDateChange([dayjs().subtract(1, "year"), dayjs()]);
  }, []);

  //날짜 필터
  useEffect(() => {
    if (patientsData?.length > 0) {
      const filterPatientsByDate = patientsData?.filter((patient) => {
        const visitDate = dayjs(patient.visitDate);
        return visitDate.isBetween(rangeDate.startDate, rangeDate.endDate);
      });

      const filterPastPatients = patientsData?.filter((patient) => {
        const visitDate = dayjs(patient.visitDate);
        return visitDate.isBetween(
          dayjs(rangeDate.startDate).subtract(1, "year"),
          dayjs(rangeDate.endDate).subtract(1, "year")
        );
      });
      setFilteredPastPatients(filterPastPatients);
      setFilteredPatients(filterPatientsByDate);
    }
  }, [rangeDate, patientsData]);

  useEffect(() => {
    rankRevenueByRegion();
  }, [totalCost]);

  const handleDateFilterButton = (content: string) => {
    const today = dayjs();
    switch (content) {
      case "오늘":
        return handleDateChange([today, today]);
      case "3일":
        return handleDateChange([today.subtract(3, "day"), today]);
      case "7일":
        return handleDateChange([today.subtract(7, "day"), today]);
      case "1개월":
        return handleDateChange([today.subtract(1, "month"), today]);
      case "3개월":
        return handleDateChange([today.subtract(3, "month"), today]);
      case "1년":
        return handleDateChange([today.subtract(1, "year"), today]);
      default:
        return;
    }
  };

  // 연령을 숫자로 변환하는 함수
  const parseAge = (ageString: string): number => {
    const ageParts = ageString.split("세");
    if (ageParts.length < 2) return 0;

    const ageYears = parseInt(ageParts[0].trim(), 10);
    const ageMonths =
      ageParts[1] && ageParts[1].includes("개월")
        ? parseInt(ageParts[1].replace("개월", "").trim(), 10)
        : 0;

    // 1년을 12개월로 보고, 월 단위로 계산하여 나이 계산
    return ageYears + ageMonths / 12;
  };

  //누적 매출
  const calTotalCost = () => {
    const result = filteredpatients.reduce((acc, cur) => {
      return acc + cur.totalCost;
    }, 0);

    const pastResult = filteredPastPatients.reduce((acc, cur) => {
      return acc + cur.totalCost;
    }, 0);

    setTotalCost({ past: Math.ceil(pastResult), current: Math.ceil(result) });
  };

  //전체 환자 수
  const calTotalPatients = () => {
    setTotalPatients(filteredpatients.length);
  };

  //신규 환자 수
  const calNewPatients = () => {
    let count = 0;
    filteredpatients?.forEach((patient) => {
      if (patient.visitType === "신환") count++;
    });
    setTotalNewPatients(count);
  };

  //재방문 환자 수
  const calRevisitedPatients = () => {
    let count = 0;
    filteredpatients?.forEach((patient) => {
      if (patient.visitType === "초진" || patient.visitType === "재진") count++;
    });
    setTotalRevisitedPatients(count);
  };

  //누적 매출 분포
  const calRevenueDate = () => {
    const revenueTrend = {};
    filteredpatients.forEach((patient) => {
      const date = patient.visitDate;
      if (!revenueTrend[date]) {
        revenueTrend[date] = patient.totalCost;
      } else {
        revenueTrend[date] += patient.totalCost;
      }
    });
    setrevenueByDate(revenueTrend);
  };

  //지역 별 매출 순위
  const rankRevenueByRegion = async () => {
    let regionData = [];
    regionAllPatients.forEach((region) => {
      const filterePatients = region.data.filter((patient) => {
        const visitDate = dayjs(patient.visitDate);

        return visitDate.isBetween(rangeDate.startDate, rangeDate.endDate);
      });
      const totalCost = filterePatients.reduce(
        (acc, cur) => acc + cur.totalCost,
        0
      );
      const patientCount = filterePatients.length;
      regionData.push({
        regionName: region.regionName,
        totalCost,
        patientCount
      });
    });
    const updatedRegionData = regionData
      .sort((a, b) => b.totalCost - a.totalCost)
      .map((region) => ({
        ...region,
        revenueRate:
          totalCost > 0
            ? ((region.totalCost / totalCost) * 100).toFixed(2) + "%"
            : "0%"
      }));
    setRankedRegion(updatedRegionData.slice(0, 5));
  };

  //연령별 환자 분포
  const calAverageAge = () => {
    const ageGroups = {
      아동: 0,
      "10대": 0,
      "20대": 0,
      "30대": 0,
      "40대": 0,
      "50대": 0,
      "60대": 0
    };
    filteredpatients.forEach((patient) => {
      if (!patient.age) return;
      const ageInYears = parseAge(patient?.age);
      if (ageInYears >= 0 && ageInYears <= 9) {
        ageGroups["아동"]++;
      } else if (ageInYears >= 10 && ageInYears <= 19) {
        ageGroups["10대"]++;
      } else if (ageInYears >= 20 && ageInYears <= 29) {
        ageGroups["20대"]++;
      } else if (ageInYears >= 30 && ageInYears <= 39) {
        ageGroups["30대"]++;
      } else if (ageInYears >= 40 && ageInYears <= 49) {
        ageGroups["40대"]++;
      } else if (ageInYears >= 50 && ageInYears <= 59) {
        ageGroups["50대"]++;
      } else {
        ageGroups["60대"]++;
      }
    });
    setAverageAge(ageGroups);
  };

  useEffect(() => {
    calTotalCost();
    calTotalPatients();
    calNewPatients();
    calRevisitedPatients();
    calAverageAge();
    calRevenueDate();
  }, [filteredpatients, filteredPastPatients]);

  return {
    rangeDate,
    handleDateChange,
    handleDateFilterButton,
    totalCost,
    totalPatients,
    totalNewPatients,
    totalRevisitedPatitents,
    averageAge,
    revenueByDate,
    rankedRegion
  };
};

export default useDashBoard;
