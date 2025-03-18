import { useEffect, useState } from "react";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { PatientData } from "../utils/ExcelParser";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
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
    { past: 0, current: 0 }
  );
  const [totalPatients, setTotalPatients] = useState<{
    past: number;
    current: number;
  }>({ past: 0, current: 0 });
  const [totalNewPatients, setTotalNewPatients] = useState<{
    past: number;
    current: number;
  }>({ past: 0, current: 0 });
  const [totalRevisitedPatitents, setTotalRevisitedPatients] = useState<{
    past: number;
    current: number;
  }>({ past: 0, current: 0 });
  const [averageAge, setAverageAge] = useState<Record<string, number>>({});
  const [revenueByDate, setrevenueByDate] = useState<Record<string, number>>(
    {}
  );
  const [filteredPastPatients, setFilteredPastPatients] = useState<
    PatientData[]
  >([]);
  const locations = [
    "가양1동 A",
    "가양1동 B",
    "가양1동 C",
    "가양2동 A",
    "가양2동 B",
    "가양3동 A",
    "가양3동 B",
    "개봉1동 A",
    "개봉1동 B",
    "개봉1동 C",
    "개봉1동 D",
    "개봉2동 A",
    "개봉2동 B",
    "개봉3동 A",
    "개봉3동 B",
    "고강1동 A",
    "고강본동 A",
    "고강본동 B",
    "고척 1동 A",
    "고척 1동 B",
    "고척 2동 A",
    "고척 2동 B",
    "공항동 B",
    "공항동A",
    "당산1동 A",
    "당산1동 B",
    "당산2동 A",
    "당산2동 B",
    "당산2동 C",
    "등촌 2동 B",
    "등촌1동 A",
    "등촌2동 A",
    "등촌3동 A",
    "등촌3동 B",
    "등촌3동 C",
    "등촌3동 D",
    "목1동 A",
    "목1동 B",
    "목2동 A",
    "목2동 B",
    "목3동 A",
    "목3동 B",
    "목4동 A",
    "목5동 A",
    "목5동 B",
    "목5동 C",
    "문래동 A",
    "문래동 B",
    "문래동 C",
    "문래동 D",
    "발산 1동 A",
    "발산 1동 B",
    "방화1동 A",
    "방화1동 B",
    "방화1동 C",
    "방화2동 A",
    "방화2동 B",
    "방화3동 A",
    "성곡동 A",
    "성곡동 B",
    "성곡동 C",
    "수궁동 A",
    "수궁동 B",
    "신도림동 A",
    "신도림동 B",
    "신도림동 C",
    "신사동 A",
    "신사동 B",
    "신사동 C",
    "신사동 D",
    "신사동 E",
    "신월 1동  A",
    "신월 2동 A",
    "신월 2동 B",
    "신월 3동 A",
    "신월 4동 A",
    "신월 4동 B",
    "신월 6동 A",
    "신월 6동 B",
    "신월 7동 A",
    "신월 7동 B",
    "신정 1동  A",
    "신정 1동 B",
    "신정 2동 A",
    "신정 3동 A",
    "신정 3동 B",
    "신정 3동 C",
    "신정 3동 D",
    "신정 3동 E",
    "신정 4동 A",
    "신정 4동 B",
    "신정 6동 A",
    "신정 6동 B",
    "신정 6동 C",
    "신정 7동 A",
    "신정 7동 B",
    "압구정동 A",
    "압구정동 B",
    "압구정동 C",
    "압구정동 D",
    "압구정동 E",
    "압구정동 F",
    "압구정동 G",
    "압구정동 H",
    "압구정동 I",
    "압구정동 J",
    "압구정동 K",
    "양평1동 A",
    "양평1동 B",
    "양평1동 C",
    "양평2동 A",
    "염창동 A",
    "염창동 B",
    "염창동 C",
    "영등포동 A",
    "영등포동 B",
    "영등포동 C",
    "오류1동 A",
    "오류1동 B",
    "오류1동 C",
    "오류2동 A",
    "오류2동 B",
    "오류2동 C",
    "우장산동 A",
    "우장산동 B",
    "우장산동 C",
    "청담동 A",
    "청담동 B",
    "청담동 C",
    "청담동 D",
    "청담동 E",
    "춘의동 A",
    "향동 A",
    "향동 B",
    "화곡 1동 A",
    "화곡 1동 B",
    "화곡 2동 A",
    "화곡 3동 A",
    "화곡 3동 B",
    "화곡 4동 A",
    "화곡 6동 A",
    "화곡 6동 B",
    "화곡 8동 A",
    "화곡본동  A"
  ];

  useEffect(() => {
    const fetchData = async () => {
      // const data: PatientData[] = await getAllMergedData();
      const data = await dashboardMock();
      const patients = await dashboardMock();
      // const allPatientsData: AllPatientsData[] = await getAllPatients("small");
      if (data) {
        setPatientsData(data);
        setFilteredPatients(data);
      }

      patients.forEach((item) => {
        const randomLocation =
          locations[Math.floor(Math.random() * locations.length)];
        item.location = randomLocation;
      });

      let regionData = locations.map((location) => {
        const filteredPatients = patients.filter(
          (patient) => patient.location === location
        );

        return {
          regionName: location,
          data: filteredPatients
        };
      });

      setRegionAllPatients(regionData);
    };
    fetchData();
    handleDateChange({
      startDate: dayjs().subtract(1, "year"),
      endDate: dayjs()
    });
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
        return handleDateChange({
          startDate: today,
          endDate: today
        });
      case "3일":
        return handleDateChange({
          startDate: today.subtract(3, "day"),
          endDate: today
        });
      case "7일":
        return handleDateChange({
          startDate: today.subtract(7, "day"),
          endDate: today
        });
      case "1개월":
        return handleDateChange({
          startDate: today.subtract(1, "month"),
          endDate: today
        });
      case "3개월":
        return handleDateChange({
          startDate: today.subtract(3, "month"),
          endDate: today
        });
      case "1년":
        return handleDateChange({
          startDate: today.subtract(1, "year"),
          endDate: today
        });
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
    setTotalPatients({
      past: filteredPastPatients.length,
      current: filteredpatients.length
    });
  };

  //신규 환자 수
  const calNewPatients = () => {
    let count = 0;
    let pastcount = 0;
    filteredpatients?.forEach((patient) => {
      if (patient.visitType === "신환") count++;
    });
    filteredPastPatients?.forEach((patient) => {
      if (patient.visitType === "신환") pastcount++;
    });
    setTotalNewPatients({ past: pastcount, current: count });
  };

  //재방문 환자 수
  const calRevisitedPatients = () => {
    let count = 0;
    let pastcount = 0;
    filteredpatients?.forEach((patient) => {
      if (patient.visitType === "초진" || patient.visitType === "재진") count++;
    });
    filteredPastPatients?.forEach((patient) => {
      if (patient.visitType === "초진" || patient.visitType === "재진")
        pastcount++;
    });
    setTotalRevisitedPatients({ past: pastcount, current: count });
  };

  //일자별 매출 통계
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
          totalCost.current > 0
            ? ((region.totalCost / totalCost.current) * 100).toFixed(2) + "%"
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
