import * as XLSX from "xlsx";
import { normalizeAge } from "../ExcelParser";
import { excelSerialToDate, calculateAge } from "../ExcelParser";

export interface DailyIncomeOrm {
  chartNumber: number;
  visitDate: string | Date;
  totalCost: number;
  visitType: "신환" | "초진" | "재진";
  doctor: string;
  age: number | null;
}

export interface PatientListOrm {
  chartNumber: number;
  address: string;
}

export async function parsePatientListOrm(
  fileBuffers: ArrayBuffer[]
): Promise<PatientListOrm[]> {
  const data: PatientListOrm[] = [];

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
      header: 1, // 배열로 읽음
      range: 0,  // 전체 행 다 읽기
    });

    if (allData.length < 2) {
      console.error("❌ Insufficient rows in the file");
      continue;
    }

    // ✅ 헤더 행 탐색: "환자등록번호" 또는 "차트번호"가 포함된 행 찾기
    let headerRowIndex = -1;
    for (let i = 0; i < allData.length; i++) {
      const row = allData[i].map((h: any) => String(h ?? "").trim());
      if (row.includes("환자등록번호") || row.includes("차트번호")) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error("❌ Could not find header row (환자등록번호/차트번호 not found)");
      continue;
    }

    // ✅ 실제 헤더 행
    const headers = allData[headerRowIndex].map((h: any) => String(h ?? "").trim());

    // ✅ 컬럼 위치 찾기
    const chartNumberIndex =
      headers.findIndex((c) => c === "환자등록번호") !== -1
        ? headers.findIndex((c) => c === "환자등록번호")
        : headers.findIndex((c) => c === "차트번호");

    const addressIndex = headers.findIndex((c) => c === "주소");

    if (chartNumberIndex === -1 || addressIndex === -1) {
      console.error("❌ Required columns not found in the file");
      console.error("Available headers:", headers);
      continue;
    }

    // ✅ 데이터 행 처리 (헤더 다음 행부터)
    for (let i = headerRowIndex + 1; i < allData.length; i++) {
      const row = allData[i];
      if (!row || row.length === 0) continue;

      const chartRaw = row[chartNumberIndex];
      if (!chartRaw) continue;

      const chartNumber = Number(String(chartRaw).replace(/,/g, ""));
      if (isNaN(chartNumber)) continue;

      const address = row[addressIndex] ? String(row[addressIndex]).trim() : "N/D";

      data.push({
        chartNumber,
        address,
      });
    }
  }

  return data;
}


export async function parseDailyIncomeOrm(
  fileBuffers: ArrayBuffer[]
): Promise<DailyIncomeOrm[]> {
  const data: DailyIncomeOrm[] = [];

  // 유틸: 후보 헤더들 중 먼저 맞는 인덱스 반환
  const findIndexByAliases = (headers: any[], aliases: string[]) => {
    for (const a of aliases) {
      const idx = headers.findIndex((c: any) => String(c ?? "").trim() === a);
      if (idx !== -1) return idx;
    }
    return -1;
  };

  for (const buffer of fileBuffers) {
    const workbook = XLSX.read(buffer, { type: "array" });
    if (workbook.SheetNames.length === 0) {
      console.error("❌ No worksheets found in file");
      continue;
    }

    // ✅ 동일 로직: 첫 시트(0) 건너뛰고 1번 시트부터 끝까지
    for (let s = 1; s < workbook.SheetNames.length; s++) {
      const sheetName = workbook.SheetNames[s];
      const worksheet = workbook.Sheets[sheetName];

      // ✅ 헤더 포함해서 읽기 (headers = allData[0])
      const allData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        range: 0,
      });

      if (!allData || allData.length < 2) {
        // 헤더 + 최소 한 줄 데이터 필요
        continue;
      }

      const headers = (allData[0] || []).map((h: any) => String(h ?? "").trim());

      // ✅ 헤더 매핑
      const chartNumberIndex = findIndexByAliases(headers, ["차트번호", "환자번호", "환자등록번호"]);
      const dateIndex       = findIndexByAliases(headers, ["진료일", "수납일", "날짜"]);
      const totalCostIndex  = findIndexByAliases(headers, ["진료비", "총진료비", "과세총금액", "비급여(과세총금액)"]);

      const shinHwanIndex   = findIndexByAliases(headers, ["신환"]);
      let visitTypeSrcIndex = findIndexByAliases(headers, ["진료비구분", "초재구분"]);

      let doctorIndex       = findIndexByAliases(headers, ["담당의", "진료의"]);
      let ageIndex          = findIndexByAliases(headers, ["나이", "나이(만)", "성별/나이"]);

      if (chartNumberIndex === -1 || dateIndex === -1 || totalCostIndex === -1) {
        console.error("❌ Required columns not found in the sheet:", sheetName);
        console.error("Available headers:", headers);
        continue;
      }

      // ✅ 데이터 행 처리 (헤더 다음 행부터)
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
        if (!row || row.length === 0) continue;

        const chartCell = row[chartNumberIndex];
        const dateCell  = row[dateIndex];
        const costCell  = row[totalCostIndex];

        if (chartCell == null || dateCell == null || costCell == null) continue;

        // 차트번호
        const chartNumber = Number(String(chartCell).replace(/,/g, ""));
        if (isNaN(chartNumber)) continue;

        // 진료비
        let totalCostRaw: any = costCell;
        if (typeof totalCostRaw === "string") totalCostRaw = totalCostRaw.replace(/,/g, "");
        const totalCost = Number(totalCostRaw);
        if (isNaN(totalCost)) continue;

        // 진료일
        let visitDate: any = dateCell;
        if (typeof visitDate === "string") {
          // "YYYY-MM-DD(요일)" 꼬리 제거, "YYYY/MM/DD" → "YYYY-MM-DD"
          visitDate = visitDate.replace(/\([^)]*\)$/, "").trim();
          if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(visitDate)) {
            visitDate = visitDate.replace(/\//g, "-");
          }
        } else if (typeof visitDate === "number") {
          visitDate = excelSerialToDate(visitDate);
        }

        // 담당의
        const doctor =
          doctorIndex !== -1 && row[doctorIndex] != null
            ? String(row[doctorIndex]).trim()
            : "";

        // 나이
        let age: number | null = null;
        if (ageIndex !== -1 && row[ageIndex] != null) {
          const rawAge = String(row[ageIndex]).trim();
          let ageNum: number | null = null;

          if (/^\d+\s*세?$/.test(rawAge)) {
            ageNum = Number(rawAge.replace(/[^\d]/g, ""));
          } else if (/^[여남남여]\/\d+$/.test(rawAge)) {
            // 예: "여/33"
            ageNum = Number(rawAge.split("/")[1]);
          } else if (/^\d+$/.test(rawAge)) {
            ageNum = Number(rawAge);
          }

          if (ageNum != null && !isNaN(ageNum)) {
            age = normalizeAge(ageNum);
          }
        }

        // 방문유형
        let visitType: "신환" | "초진" | "재진" = "재진";
        const shin = shinHwanIndex !== -1 && row[shinHwanIndex] != null
          ? String(row[shinHwanIndex]).trim().toUpperCase()
          : "";
        const typeSrc = visitTypeSrcIndex !== -1 && row[visitTypeSrcIndex] != null
          ? String(row[visitTypeSrcIndex]).replace(/\s/g, "")
          : "";

        if (shin === "Y") visitType = "신환";
        else if (typeSrc === "초진") visitType = "초진";
        else visitType = "재진";

        data.push({
          chartNumber,
          visitDate: String(visitDate),
          totalCost,
          visitType,
          doctor,
          age,
        });
      }
    }
  }

  return data;
}
