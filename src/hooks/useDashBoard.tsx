import { useEffect, useState } from "react";
import { getAllPatients } from "../store/indexded_db/RegionDB";
import useRangeDurationDatePicker from "./useRangeDurationDatePicker";
import { PatientData } from "../utils/ExcelParser";

const useDashBoard = () => {
  const { rangeDate, handleDateChange } = useRangeDurationDatePicker();
  const [patientsData, setPatientsData] = useState<PatientData[] | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalNewPatients, setTotalNewPatients] = useState<number>(0);
  const [totalRevisitedPatitents, setTotalRevisitedPatients] =
    useState<number>(0);
  const [averageAge, setAverageAge] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      const data: PatientData[] = await getAllPatients("dong");
      if (data) {
        setPatientsData(data);
      }
    };
    fetchData();
  }, []);

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
    if (patientsData === null) return;
    const result = patientsData.reduce((acc, cur) => {
      return acc + cur.totalCost;
    }, 0);
    setTotalCost(Math.ceil(result));
  };

  //전체 환자 수
  const calTotalPatients = () => {
    if (patientsData === null) return;
    const patientsSet = new Set();

    let count = 0;
    patientsData.forEach((patient) => {
      if (!patientsSet.has(patient.chartNumber)) {
        patientsSet.add(patient.chartNumber);
        count++;
      }
    });
    setTotalPatients(count);
  };

  //신규 환자 수
  const calNewPatients = () => {
    if (patientsData === null) return;
    let count = 0;
    patientsData?.forEach((patient) => {
      if (patient.visitType === "신환") count++;
    });
    setTotalNewPatients(count);
  };

  //재방문 환자 수
  const calRevisitedPatients = () => {
    if (patientsData === null) return;
    let count = 0;
    patientsData?.forEach((patient) => {
      if (patient.visitType === "초진" || patient.visitType === "재진") count++;
    });
    setTotalRevisitedPatients(count);
  };

  //누적 매출 분포
  const calRevenueDate = () => {};

  //지역 별 매출 순위

  //연령별 환자 분포
  const calAverageAge = () => {
    if (patientsData === null) return;
    const ageGroups = {
      아동: 0,
      "10대": 0,
      "20대": 0,
      "30대": 0,
      "40대": 0,
      "50대": 0,
      "60대": 0
    };
    patientsData.forEach((patient) => {
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
    if (patientsData) {
      calTotalCost();
      calTotalPatients();
      calNewPatients();
      calRevisitedPatients();
      calAverageAge();
    }
  }, [patientsData]);

  return {
    rangeDate,
    handleDateChange,
    totalCost,
    totalPatients,
    totalNewPatients,
    totalRevisitedPatitents,
    averageAge
  };
};

export default useDashBoard;
