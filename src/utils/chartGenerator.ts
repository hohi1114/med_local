interface WeeklyChartData {
  week: string;
  revenue: number;
  newPatients: number;
}

/**
 * 주별 유입 추이 차트를 생성하고 Base64 이미지로 반환
 * 순수 Canvas API를 사용하여 차트 생성
 *
 * @param data 주별 데이터 배열
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateWeeklyTrendChart(
  data: WeeklyChartData[]
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 여백 설정
    const padding = { top: 50, right: 80, bottom: 50, left: 100 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 배경 (단색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 데이터 추출
    const revenues = data.map((d) => d.revenue);
    const newPatients = data.map((d) => d.newPatients);
    const maxRevenue = Math.max(...revenues);
    const maxNewPatients = Math.max(...newPatients);

    // 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('주별 유입 추이', width / 2, 24);

    // X축 간격
    const barWidth = chartWidth / data.length;
    const barPadding = barWidth * 0.25;

    // Y축 눈금 계산 (Revenue)
    const revenueSteps = 5;
    let revenueUnit: number;
    if (maxRevenue < 1000000) {
      revenueUnit = 100000;
    } else if (maxRevenue < 10000000) {
      revenueUnit = 1000000;
    } else if (maxRevenue < 100000000) {
      revenueUnit = 10000000;
    } else {
      revenueUnit = 50000000;
    }
    const roundedMaxRevenue = Math.ceil(maxRevenue / revenueUnit) * revenueUnit;

    // 격자선 먼저 그리기
    for (let i = 0; i <= revenueSteps; i++) {
      const displayY = padding.top + chartHeight - (chartHeight / revenueSteps) * i;
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, displayY);
      ctx.lineTo(padding.left + chartWidth, displayY);
      ctx.stroke();
    }

    // Bar 차트 그리기 (Revenue) - 단색, 둥근 상단
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barPadding;
      const barHeight = (item.revenue / roundedMaxRevenue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;
      const barWidthVal = barWidth - barPadding * 2;
      const cornerRadius = 3;

      ctx.fillStyle = '#fbbf24';

      // 둥근 상단 막대
      ctx.beginPath();
      ctx.moveTo(x + cornerRadius, y);
      ctx.lineTo(x + barWidthVal - cornerRadius, y);
      ctx.quadraticCurveTo(x + barWidthVal, y, x + barWidthVal, y + cornerRadius);
      ctx.lineTo(x + barWidthVal, y + barHeight);
      ctx.lineTo(x, y + barHeight);
      ctx.lineTo(x, y + cornerRadius);
      ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
      ctx.closePath();
      ctx.fill();
    });

    // Y축 눈금 계산 (New Patients)
    const patientsSteps = 5;
    let patientsUnit: number;
    if (maxNewPatients < 50) {
      patientsUnit = 5;
    } else if (maxNewPatients < 100) {
      patientsUnit = 10;
    } else if (maxNewPatients < 500) {
      patientsUnit = 50;
    } else {
      patientsUnit = 100;
    }
    const roundedMaxPatients = Math.ceil(maxNewPatients / patientsUnit) * patientsUnit;

    // Line 차트 그리기 (New Patients)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const lineHeight = (item.newPatients / roundedMaxPatients) * chartHeight;
      const y = padding.top + chartHeight - lineHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 점 그리기
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const lineHeight = (item.newPatients / roundedMaxPatients) * chartHeight;
      const y = padding.top + chartHeight - lineHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X축 레이블
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const y = padding.top + chartHeight + 20;
      ctx.fillText(item.week, x, y);
    });

    // Y축 레이블 (Revenue - 왼쪽)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Revenue (KRW)', 0, 0);
    ctx.restore();

    // Y축 눈금 값 (Revenue)
    for (let i = 0; i <= revenueSteps; i++) {
      const value = (roundedMaxRevenue / revenueSteps) * i;
      const displayY = padding.top + chartHeight - (chartHeight / revenueSteps) * i;

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('ko-KR').format(value),
        padding.left - 8,
        displayY + 3
      );
    }

    // Y축 레이블 (New Patients - 오른쪽)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.save();
    ctx.translate(width - 20, height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('New Patients', 0, 0);
    ctx.restore();

    // Y축 눈금 값 (New Patients)
    for (let i = 0; i <= patientsSteps; i++) {
      const value = (roundedMaxPatients / patientsSteps) * i;
      const displayY = padding.top + chartHeight - (chartHeight / patientsSteps) * i;

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(value.toString(), padding.left + chartWidth + 8, displayY + 3);
    }

    // X축 선
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // 범례
    const legendY = padding.top - 20;
    const legendBoxSize = 10;

    // Revenue 범례
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(padding.left, legendY, legendBoxSize, legendBoxSize);

    ctx.fillStyle = '#6b7280';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Revenue', padding.left + 14, legendY + 8);

    // New Patients 범례
    const lineStartX = padding.left + 80;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, legendY + 5);
    ctx.lineTo(lineStartX + 16, legendY + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(lineStartX + 8, legendY + 5, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#6b7280';
    ctx.fillText('New Patients', lineStartX + 22, legendY + 8);

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}

interface AgeAnalysisData {
  periodA: Record<string, number>;
  periodB: Record<string, number>;
}

/**
 * 연령대별 신환 유입 추이 차트를 생성하고 Base64 이미지로 반환
 *
 * @param data 연령대별 데이터 (periodA, periodB)
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateAgeAnalysisChart(
  data: AgeAnalysisData
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 450;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 여백 설정
    const padding = { top: 50, right: 40, bottom: 50, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 배경 (단색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 연령대 배열
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const chartLabels = ageGroups.map((age) => (age === '70+' ? '70+' : `${age}대`));

    // 데이터 추출
    const chartDataA = ageGroups.map((age) => data.periodA[age] || 0);
    const chartDataB = ageGroups.map((age) => data.periodB[age] || 0);

    // 최대값 계산
    const maxValue = Math.max(...chartDataA, ...chartDataB);

    // Y축 눈금 계산
    const steps = 5;
    let unit: number;
    if (maxValue < 50) {
      unit = 5;
    } else if (maxValue < 100) {
      unit = 10;
    } else if (maxValue < 500) {
      unit = 50;
    } else if (maxValue < 1000) {
      unit = 100;
    } else {
      unit = 500;
    }
    const roundedMaxValue = Math.ceil(maxValue / unit) * unit || 10;

    // 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('연령대별 신환 유입 추이 (A vs B)', width / 2, 24);

    // 격자선 먼저 그리기
    for (let i = 0; i <= steps; i++) {
      const y = padding.top + chartHeight - (chartHeight / steps) * i;
      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    // 그룹 간격
    const groupWidth = chartWidth / ageGroups.length;
    const barWidth = groupWidth * 0.32;
    const cornerRadius = 2;

    // Bar 차트 그리기 - 단색, 심플
    ageGroups.forEach((_, index) => {
      const x = padding.left + index * groupWidth;

      // B(비교 기간) - 회색
      const heightB = (chartDataB[index] / roundedMaxValue) * chartHeight;
      const yB = padding.top + chartHeight - heightB;
      const xB = x + groupWidth * 0.15;

      ctx.fillStyle = '#d1d5db';

      ctx.beginPath();
      ctx.moveTo(xB + cornerRadius, yB);
      ctx.lineTo(xB + barWidth - cornerRadius, yB);
      ctx.quadraticCurveTo(xB + barWidth, yB, xB + barWidth, yB + cornerRadius);
      ctx.lineTo(xB + barWidth, yB + heightB);
      ctx.lineTo(xB, yB + heightB);
      ctx.lineTo(xB, yB + cornerRadius);
      ctx.quadraticCurveTo(xB, yB, xB + cornerRadius, yB);
      ctx.closePath();
      ctx.fill();

      // A(분석 기간) - 파란색
      const heightA = (chartDataA[index] / roundedMaxValue) * chartHeight;
      const yA = padding.top + chartHeight - heightA;
      const xA = x + groupWidth * 0.15 + barWidth + 4;

      ctx.fillStyle = '#3b82f6';

      ctx.beginPath();
      ctx.moveTo(xA + cornerRadius, yA);
      ctx.lineTo(xA + barWidth - cornerRadius, yA);
      ctx.quadraticCurveTo(xA + barWidth, yA, xA + barWidth, yA + cornerRadius);
      ctx.lineTo(xA + barWidth, yA + heightA);
      ctx.lineTo(xA, yA + heightA);
      ctx.lineTo(xA, yA + cornerRadius);
      ctx.quadraticCurveTo(xA, yA, xA + cornerRadius, yA);
      ctx.closePath();
      ctx.fill();
    });

    // X축 레이블
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    chartLabels.forEach((label, index) => {
      const x = padding.left + index * groupWidth + groupWidth / 2;
      const y = padding.top + chartHeight + 20;
      ctx.fillText(label, x, y);
    });

    // Y축 레이블
    ctx.fillStyle = '#9ca3af';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.save();
    ctx.translate(18, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('환자 수', 0, 0);
    ctx.restore();

    // Y축 눈금
    for (let i = 0; i <= steps; i++) {
      const value = (roundedMaxValue / steps) * i;
      const y = padding.top + chartHeight - (chartHeight / steps) * i;

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('ko-KR').format(value),
        padding.left - 8,
        y + 3
      );
    }

    // X축 선
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // 범례
    const legendX = width - padding.right - 200;
    const legendY = padding.top - 22;
    const legendBoxSize = 10;

    // B(비교 기간)
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(legendX, legendY, legendBoxSize, legendBoxSize);
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('B(비교 기간)', legendX + 14, legendY + 8);

    // A(분석 기간)
    const legendAX = legendX + 95;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(legendAX, legendY, legendBoxSize, legendBoxSize);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('A(분석 기간)', legendAX + 14, legendY + 8);

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}

export interface WeeklyAgeHeatmapData {
  weeks: string[];
  ages: string[];
  matrix: number[][]; // matrix[weekIndex][ageIndex]
  periodLabels?: string[]; // 각 주가 속한 기간 ('A' 또는 'B')
}

/**
 * 주별 연령대별 신환 추이 스택 막대 차트를 생성하고 Base64로 반환
 *
 * @param data 주별 연령대 데이터
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateWeeklyAgeHeatmapChart(
  data: WeeklyAgeHeatmapData
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

    const PADDING = { top: 60, right: 190, bottom: 60, left: 70 };
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('주별 연령대별 신환 추이', width / 2, 28);

    // 연령대 색상
    const ageColors = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#4ade80', '#94a3b8'];
    const ageLabels = data.ages.map(a => a === '70+' ? '70대+' : `${a}대`);

    // 주별 합계 → Y축 최대값
    const weekTotals = data.weeks.map((_, wi) =>
      data.ages.reduce((s, _, ai) => s + (data.matrix[wi]?.[ai] || 0), 0)
    );
    const maxTotal = Math.max(...weekTotals) || 1;
    const ySteps = 5;
    const rawStep = maxTotal / ySteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const yMax = Math.ceil(rawStep / mag) * mag * ySteps;

    // A/B 기간 배경 음영
    const slotW = chartWidth / data.weeks.length;
    if (data.periodLabels) {
      data.periodLabels.forEach((label, wi) => {
        ctx.fillStyle = label === 'A' ? 'rgba(16,185,129,0.07)' : 'rgba(248,113,113,0.07)';
        ctx.fillRect(PADDING.left + wi * slotW, PADDING.top, slotW, chartHeight);
      });
    }

    // 그리드 및 Y축
    for (let i = 0; i <= ySteps; i++) {
      const y = PADDING.top + chartHeight - (i / ySteps) * chartHeight;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(new Intl.NumberFormat('ko-KR').format(Math.round((yMax / ySteps) * i)), PADDING.left - 8, y);
    }

    // 스택 막대 그리기
    const barPad = slotW * 0.12;
    const barW = slotW - barPad * 2;
    data.weeks.forEach((_, wi) => {
      let stackY = PADDING.top + chartHeight;
      const x = PADDING.left + wi * slotW + barPad;

      data.ages.forEach((_, ai) => {
        const value = data.matrix[wi]?.[ai] || 0;
        if (value === 0) return;
        const barH = (value / yMax) * chartHeight;
        stackY -= barH;

        ctx.fillStyle = ageColors[ai];
        ctx.fillRect(x, stackY, barW, barH);

        if (barH > 14) {
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.font = '500 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const display = Number.isInteger(value) ? value.toString() : value.toFixed(1);
          ctx.fillText(display, x + barW / 2, stackY + barH / 2);
        }
      });

      // 막대 위에 합계 표시
      const total = weekTotals[wi];
      ctx.fillStyle = '#374151';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const displayTotal = Number.isInteger(total) ? total.toString() : total.toFixed(1);
      ctx.fillText(displayTotal, x + barW / 2, stackY - 3);
    });

    // X축 레이블 (주차 + A/B)
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, wi) => {
      const x = PADDING.left + wi * slotW + slotW / 2;
      ctx.fillStyle = '#6b7280';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(week, x, PADDING.top + chartHeight + 8);

      if (data.periodLabels) {
        const label = data.periodLabels[wi];
        ctx.fillStyle = label === 'A' ? '#10b981' : '#f87171';
        ctx.font = '700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(label, x, PADDING.top + chartHeight + 22);
      }
    });

    // 범례 (오른쪽)
    const lx = width - PADDING.right + 20;
    let ly = PADDING.top + 10;

    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ageColors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(lx, ly, 13, 13);
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ageLabels[i], lx + 17, ly + 6);
      ly += 22;
    });

    ly += 10;
    ctx.fillStyle = 'rgba(16,185,129,0.2)';
    ctx.fillRect(lx, ly, 13, 13);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(lx, ly, 13, 13);
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('A(분석 기간)', lx + 17, ly + 6);
    ly += 20;

    ctx.fillStyle = 'rgba(248,113,113,0.2)';
    ctx.fillRect(lx, ly, 13, 13);
    ctx.strokeStyle = '#f87171';
    ctx.strokeRect(lx, ly, 13, 13);
    ctx.fillStyle = '#374151';
    ctx.fillText('B(비교 기간)', lx + 17, ly + 6);

    setTimeout(() => resolve(canvas.toDataURL('image/png')), 100);
  });
}

export interface AreaChartData {
  area: string;   // 예: "천호2동"
  periodA: number; // 분석기간 값
  periodB: number; // 비교기간 값
}

/**
 * 지역별 신환 유입 추이 차트를 생성하고 Base64 이미지로 반환
 *
 * @param data 지역별 데이터 배열
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateAreaComparisonChart(
  data: AreaChartData[]
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = Math.max(400, data.length * 50 + 100);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 50, right: 60, bottom: 40, left: 100 };

    // 배경 (단색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // periodA 내림차순 정렬
    const sortedData = [...data].sort((a, b) => b.periodA - a.periodA);

    // 최대값 계산
    const maxValue = Math.max(...sortedData.flatMap(d => [d.periodA, d.periodB])) || 10;

    // X축 눈금 계산
    const xAxisSteps = 5;
    let xAxisUnit: number;
    if (maxValue < 50) {
      xAxisUnit = 10;
    } else if (maxValue < 100) {
      xAxisUnit = 20;
    } else if (maxValue < 500) {
      xAxisUnit = 50;
    } else if (maxValue < 1000) {
      xAxisUnit = 100;
    } else {
      xAxisUnit = 200;
    }
    const roundedMaxValue = Math.ceil(maxValue / xAxisUnit) * xAxisUnit;

    // 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('지역별 신환 유입 추이 (A vs B)', width / 2, 24);

    // 차트 영역 계산
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const rowHeight = chartHeight / sortedData.length;

    // X축 그리드선
    for (let i = 0; i <= xAxisSteps; i++) {
      const value = (roundedMaxValue / xAxisSteps) * i;
      const x = PADDING.left + (value / roundedMaxValue) * chartWidth;

      ctx.strokeStyle = '#f3f4f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + chartHeight);
      ctx.stroke();

      // 눈금 레이블
      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(new Intl.NumberFormat('ko-KR').format(value), x, PADDING.top + chartHeight + 6);
    }

    // X축 선
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top + chartHeight);
    ctx.lineTo(PADDING.left + chartWidth, PADDING.top + chartHeight);
    ctx.stroke();

    // 막대 차트
    const barHeight = Math.min(14, rowHeight * 0.35);
    const barGap = 2;

    sortedData.forEach((item, index) => {
      const y = PADDING.top + index * rowHeight + rowHeight / 2;

      // B(비교 기간) 막대
      const barWidthB = (item.periodB / roundedMaxValue) * chartWidth;
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(PADDING.left, y - barHeight - barGap / 2, barWidthB, barHeight);

      // A(분석 기간) 막대
      const barWidthA = (item.periodA / roundedMaxValue) * chartWidth;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(PADDING.left, y + barGap / 2, barWidthA, barHeight);

      // 값 텍스트
      ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      if (barWidthB > 5) {
        ctx.fillStyle = '#9ca3af';
        ctx.fillText(item.periodB.toString(), PADDING.left + barWidthB + 4, y - barHeight / 2 - barGap / 2);
      }
      if (barWidthA > 5) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(item.periodA.toString(), PADDING.left + barWidthA + 4, y + barHeight / 2 + barGap / 2);
      }

      // Y축 지역명
      ctx.fillStyle = '#374151';
      ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.area, PADDING.left - 8, y);
    });

    // 범례
    const legendX = width - PADDING.right - 180;
    const legendY = PADDING.top - 22;
    const legendBoxSize = 10;

    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(legendX, legendY, legendBoxSize, legendBoxSize);
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('B(비교 기간)', legendX + 14, legendY + 8);

    const legendAX = legendX + 95;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(legendAX, legendY, legendBoxSize, legendBoxSize);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('A(분석 기간)', legendAX + 14, legendY + 8);

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}

interface WeeklyRegionHeatmapData {
  weeks: string[];
  regions: string[];
  matrix: number[][]; // [regionIdx][weekIdx]
}

function _drawRegionLineChart(data: WeeklyRegionHeatmapData, title: string, colors: string[]): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

    const PADDING = { top: 60, right: 190, bottom: 60, left: 70 };
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 28);

    // Y축 최대값 (이 그룹만의 스케일)
    const maxValue = Math.max(...data.matrix.flatMap(row => row), 1);
    const ySteps = 5;
    const rawStep = maxValue / ySteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const yMax = Math.ceil(rawStep / mag) * mag * ySteps;

    // 그리드 및 Y축
    for (let i = 0; i <= ySteps; i++) {
      const y = PADDING.top + chartHeight - (i / ySteps) * chartHeight;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(new Intl.NumberFormat('ko-KR').format(Math.round((yMax / ySteps) * i)), PADDING.left - 8, y);
    }

    const n = data.weeks.length;
    const xSlot = chartWidth / (n > 1 ? n - 1 : 1);

    // 각 지역 라인 그리기
    data.regions.forEach((region, ri) => {
      const color = colors[ri % colors.length];
      const values = data.matrix[ri];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([]);
      ctx.beginPath();
      values.forEach((val, wi) => {
        const x = PADDING.left + wi * xSlot;
        const y = PADDING.top + chartHeight - (val / yMax) * chartHeight;
        wi === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      values.forEach((val, wi) => {
        const x = PADDING.left + wi * xSlot;
        const y = PADDING.top + chartHeight - (val / yMax) * chartHeight;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        const display = Number.isInteger(val) ? val.toString() : val.toFixed(1);
        ctx.fillStyle = color;
        ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(display, x, y - 8);
      });
    });

    // X축 레이블
    ctx.fillStyle = '#6b7280';
    ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, wi) => {
      const x = PADDING.left + wi * xSlot;
      ctx.fillText(week, x, PADDING.top + chartHeight + 10);
    });

    // 범례 (오른쪽)
    const lx = width - PADDING.right + 20;
    let ly = PADDING.top + 20;
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    data.regions.forEach((region, ri) => {
      const color = colors[ri % colors.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6);
      ctx.lineTo(lx + 16, ly + 6);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx + 8, ly + 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx + 8, ly + 6, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(region, lx + 22, ly + 6);
      ly += 26;
    });

    setTimeout(() => resolve(canvas.toDataURL('image/png')), 100);
  });
}

/**
 * 주별 지역별 신환 유입 멀티 라인 차트를 두 개 생성 (TOP3 / 4~7위 별도 스케일)
 *
 * @param data 주별 지역별 데이터 (regions 순서: 상위부터 정렬된 상태)
 * @returns [top3 이미지, rest 이미지] Base64 Data URL 튜플
 */
export async function generateWeeklyRegionHeatmapChart(
  data: WeeklyRegionHeatmapData
): Promise<[string, string]> {
  const top3Colors = ['#3b82f6', '#10b981', '#f59e0b'];
  const restColors = ['#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  const top3Data: WeeklyRegionHeatmapData = {
    weeks: data.weeks,
    regions: data.regions.slice(0, 3),
    matrix: data.matrix.slice(0, 3),
  };
  const restData: WeeklyRegionHeatmapData = {
    weeks: data.weeks,
    regions: data.regions.slice(3),
    matrix: data.matrix.slice(3),
  };

  const [top3Image, restImage] = await Promise.all([
    _drawRegionLineChart(top3Data, 'TOP 3 지역 주별 신환 유입 추이', top3Colors),
    _drawRegionLineChart(restData, '4~7위 지역 주별 신환 유입 추이', restColors),
  ]);
  return [top3Image, restImage];
}

interface WeeklyAreaConcentrationData {
  weeks: string[];
  top3Counts: number[];      // 각 주의 TOP3 동 합계
  top7Counts: number[];      // 각 주의 Sub4 동 합계 (4~7위)
  top3Ratios: number[];      // 각 주의 TOP3 비율 (%)
  top7Ratios: number[];      // 각 주의 Sub4 비율 (%)
}

/**
 * 주별 유입 추이 (TOP3 vs Sub4 + 집중도) 콤보 차트 생성
 * - 위: TOP3 신환 수(막대) + 비율(라인)
 * - 아래: Sub4 신환 수(막대) + 비율(라인)
 *
 * @param data 주별 TOP3/Sub4 데이터
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateWeeklyAreaConcentrationChart(
  data: WeeklyAreaConcentrationData
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 50, right: 80, bottom: 30, left: 70 };
    const CHART_HEIGHT = 200;
    const GAP_BETWEEN = 80;

    // 배경색
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 메인 제목
    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('주별 유입 집중도 분석', width / 2, 24);

    const chartWidth = width - PADDING.left - PADDING.right;
    const barWidth = Math.min(60, (chartWidth / data.weeks.length) * 0.6);
    const barGap = (chartWidth - barWidth * data.weeks.length) / (data.weeks.length + 1);

    // 최대값 계산
    const maxTop3Count = Math.max(...data.top3Counts) || 1;
    const maxSub4Count = Math.max(...data.top7Counts) || 1;
    const maxTop3Ratio = Math.max(...data.top3Ratios) || 1;
    const maxSub4Ratio = Math.max(...data.top7Ratios) || 1;

    // Y축 스케일 함수
    const getRatioY = (value: number, maxValue: number, chartStartY: number) => {
      return chartStartY + CHART_HEIGHT - (value / maxValue) * CHART_HEIGHT;
    };

    // 그리드 라인 그리기 함수
    const drawGridLines = (chartStartY: number) => {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = chartStartY + (CHART_HEIGHT / 4) * i;
        ctx.beginPath();
        ctx.moveTo(PADDING.left, y);
        ctx.lineTo(width - PADDING.right, y);
        ctx.stroke();
      }
    };

    // ===============================
    // Chart 1: TOP3 신환 수 + 비율
    // ===============================
    const chart1StartY = PADDING.top;

    // 부제목 1
    ctx.fillStyle = '#1e40af';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TOP 3 지역 신환 추이', width / 2, chart1StartY - 8);

    // 그리드 라인
    drawGridLines(chart1StartY);

    // 막대 그래프 (신환 수) - 파란색
    const barColor = '#3b82f6';
    const barHoverColor = '#2563eb';

    data.weeks.forEach((_, weekIdx) => {
      const value = data.top3Counts[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap);
      const barHeight = (value / maxTop3Count) * CHART_HEIGHT;
      const y = chart1StartY + CHART_HEIGHT - barHeight;

      // 그라데이션 막대
      const gradient = ctx.createLinearGradient(x, y, x, chart1StartY + CHART_HEIGHT);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, barHoverColor);
      ctx.fillStyle = gradient;

      // 둥근 모서리 막대
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, chart1StartY + CHART_HEIGHT);
      ctx.lineTo(x, chart1StartY + CHART_HEIGHT);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // 막대 위에 값 표시
      ctx.fillStyle = '#374151';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), x + barWidth / 2, y - 6);
    });

    // 라인 그래프 (비율) - 초록색
    const lineColor = '#10b981';
    const pointColor = '#059669';

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    data.weeks.forEach((_, weekIdx) => {
      const value = data.top3Ratios[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      const y = getRatioY(value, maxTop3Ratio, chart1StartY);

      if (weekIdx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 라인 포인트 및 비율 값
    data.weeks.forEach((_, weekIdx) => {
      const value = data.top3Ratios[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      const y = getRatioY(value, maxTop3Ratio, chart1StartY);

      // 포인트 (큰 원 + 작은 원)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pointColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // 비율 값 (라인 위에)
      ctx.fillStyle = '#059669';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1) + '%', x, y - 14);
    });

    // Y축 레이블 (왼쪽: 신환 수)
    ctx.fillStyle = '#3b82f6';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('신환 수', PADDING.left - 10, chart1StartY - 20);
    for (let i = 0; i <= 4; i++) {
      const value = (maxTop3Count / 4) * (4 - i);
      const y = chart1StartY + (CHART_HEIGHT / 4) * i;
      ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), PADDING.left - 10, y);
    }

    // Y축 레이블 (오른쪽: 비율)
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.fillText('비율 (%)', width - PADDING.right + 10, chart1StartY - 20);
    for (let i = 0; i <= 4; i++) {
      const value = (maxTop3Ratio / 4) * (4 - i);
      const y = chart1StartY + (CHART_HEIGHT / 4) * i;
      ctx.fillText(value.toFixed(1) + '%', width - PADDING.right + 10, y);
    }

    // X축 레이블
    ctx.fillStyle = '#6b7280';
    ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, weekIdx) => {
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      ctx.fillText(week, x, chart1StartY + CHART_HEIGHT + 8);
    });

    // ===============================
    // Chart 2: Sub4 신환 수 + 비율
    // ===============================
    const chart2StartY = chart1StartY + CHART_HEIGHT + GAP_BETWEEN;

    // 부제목 2
    ctx.fillStyle = '#7c3aed';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sub 4 지역 신환 추이', width / 2, chart2StartY - 8);

    // 그리드 라인
    drawGridLines(chart2StartY);

    // 막대 그래프 (신환 수) - 보라색
    const sub4BarColor = '#8b5cf6';
    const sub4BarHoverColor = '#7c3aed';

    data.weeks.forEach((_, weekIdx) => {
      const value = data.top7Counts[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap);
      const barHeight = (value / maxSub4Count) * CHART_HEIGHT;
      const y = chart2StartY + CHART_HEIGHT - barHeight;

      // 그라데이션 막대
      const gradient = ctx.createLinearGradient(x, y, x, chart2StartY + CHART_HEIGHT);
      gradient.addColorStop(0, sub4BarColor);
      gradient.addColorStop(1, sub4BarHoverColor);
      ctx.fillStyle = gradient;

      // 둥근 모서리 막대
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, chart2StartY + CHART_HEIGHT);
      ctx.lineTo(x, chart2StartY + CHART_HEIGHT);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // 막대 위에 값 표시
      ctx.fillStyle = '#374151';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), x + barWidth / 2, y - 6);
    });

    // 라인 그래프 (비율) - 주황색
    const sub4LineColor = '#f59e0b';
    const sub4PointColor = '#d97706';

    ctx.strokeStyle = sub4LineColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    data.weeks.forEach((_, weekIdx) => {
      const value = data.top7Ratios[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      const y = getRatioY(value, maxSub4Ratio, chart2StartY);

      if (weekIdx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 라인 포인트 및 비율 값
    data.weeks.forEach((_, weekIdx) => {
      const value = data.top7Ratios[weekIdx];
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      const y = getRatioY(value, maxSub4Ratio, chart2StartY);

      // 포인트 (큰 원 + 작은 원)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = sub4PointColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // 비율 값 (라인 위에)
      ctx.fillStyle = '#d97706';
      ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(value.toFixed(1) + '%', x, y - 14);
    });

    // Y축 레이블 (왼쪽: 신환 수)
    ctx.fillStyle = '#8b5cf6';
    ctx.font = '500 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('신환 수', PADDING.left - 10, chart2StartY - 20);
    for (let i = 0; i <= 4; i++) {
      const value = (maxSub4Count / 4) * (4 - i);
      const y = chart2StartY + (CHART_HEIGHT / 4) * i;
      ctx.fillText(Number.isInteger(value) ? value.toString() : value.toFixed(1), PADDING.left - 10, y);
    }

    // Y축 레이블 (오른쪽: 비율)
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'left';
    ctx.fillText('비율 (%)', width - PADDING.right + 10, chart2StartY - 20);
    for (let i = 0; i <= 4; i++) {
      const value = (maxSub4Ratio / 4) * (4 - i);
      const y = chart2StartY + (CHART_HEIGHT / 4) * i;
      ctx.fillText(value.toFixed(1) + '%', width - PADDING.right + 10, y);
    }

    // X축 레이블
    ctx.fillStyle = '#6b7280';
    ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, weekIdx) => {
      const x = PADDING.left + barGap + weekIdx * (barWidth + barGap) + barWidth / 2;
      ctx.fillText(week, x, chart2StartY + CHART_HEIGHT + 8);
    });

    // 범례
    const legendY = height - 20;
    const legendStartX = width / 2 - 180;

    // 막대 범례
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(legendStartX, legendY - 6, 16, 12);
    ctx.fillStyle = '#374151';
    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('신환 수 (TOP3)', legendStartX + 22, legendY + 2);

    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(legendStartX + 110, legendY - 6, 16, 12);
    ctx.fillStyle = '#374151';
    ctx.fillText('신환 수 (Sub4)', legendStartX + 132, legendY + 2);

    // 라인 범례
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legendStartX + 230, legendY);
    ctx.lineTo(legendStartX + 246, legendY);
    ctx.stroke();
    ctx.fillStyle = '#374151';
    ctx.fillText('비율 (TOP3)', legendStartX + 252, legendY + 2);

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(legendStartX + 330, legendY);
    ctx.lineTo(legendStartX + 346, legendY);
    ctx.stroke();
    ctx.fillStyle = '#374151';
    ctx.fillText('비율 (Sub4)', legendStartX + 352, legendY + 2);

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}

export interface RetentionRateData {
  weeks: string[];
  rates: (number | null)[];
  newCounts: number[];
  returnCounts: (number | null)[];
  periods: ('A' | 'B')[]; // 각 주차가 A(분석) 또는 B(비교) 기간인지
}

export async function generateRetentionRateChart(data: RetentionRateData): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 460;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context를 가져올 수 없습니다.');

    const PADDING = { top: 60, right: 60, bottom: 80, left: 70 };
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#374151';
    ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('신환 2주 내 재방문율 주별 추이', width / 2, 28);

    const n = data.weeks.length;
    const slotWidth = chartWidth / n;
    const barWidth = Math.min(60, slotWidth * 0.55);

    // A/B 기간 배경 음영 (막대 그리기 전)
    let segStart = 0;
    for (let wi = 0; wi <= n; wi++) {
      const period = wi < n ? data.periods[wi] : null;
      const prevPeriod = wi > 0 ? data.periods[wi - 1] : null;
      if (wi === n || (wi > 0 && period !== prevPeriod)) {
        const p = prevPeriod!;
        const x1 = PADDING.left + segStart * slotWidth;
        const x2 = PADDING.left + wi * slotWidth;
        ctx.fillStyle = p === 'A' ? 'rgba(219,234,254,0.35)' : 'rgba(254,226,226,0.35)';
        ctx.fillRect(x1, PADDING.top, x2 - x1, chartHeight);
        // 기간 레이블
        ctx.fillStyle = p === 'A' ? '#3b82f6' : '#ef4444';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(p === 'A' ? '분석기간 (A)' : '비교기간 (B)', (x1 + x2) / 2, PADDING.top + 4);
        segStart = wi;
      }
    }

    // Y축 그리드
    const yMax = 100;
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = PADDING.top + chartHeight - (i / ySteps) * chartHeight;
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartWidth, y);
      ctx.stroke();
      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${((yMax / ySteps) * i).toFixed(0)}%`, PADDING.left - 8, y);
    }

    // 막대 그리기
    data.weeks.forEach((week, wi) => {
      const rate = data.rates[wi];
      const cx = PADDING.left + (wi + 0.5) * slotWidth;

      if (rate === null) {
        const phH = chartHeight * 0.08;
        const phY = PADDING.top + chartHeight - phH;
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - barWidth / 2, phY, barWidth, phH);
        ctx.setLineDash([]);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('집계중', cx, phY - 3);
      } else {
        const barH = Math.max((rate / yMax) * chartHeight, 2);
        const barY = PADDING.top + chartHeight - barH;
        const color = rate < 20 ? '#ef4444' : rate < 40 ? '#f59e0b' : '#10b981';
        const r = 4;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx - barWidth / 2 + r, barY);
        ctx.lineTo(cx + barWidth / 2 - r, barY);
        ctx.quadraticCurveTo(cx + barWidth / 2, barY, cx + barWidth / 2, barY + r);
        ctx.lineTo(cx + barWidth / 2, PADDING.top + chartHeight);
        ctx.lineTo(cx - barWidth / 2, PADDING.top + chartHeight);
        ctx.lineTo(cx - barWidth / 2, barY + r);
        ctx.quadraticCurveTo(cx - barWidth / 2, barY, cx - barWidth / 2 + r, barY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#374151';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${rate.toFixed(1)}%`, cx, barY - 4);
      }
    });

    // X축 레이블
    data.weeks.forEach((week, wi) => {
      const cx = PADDING.left + (wi + 0.5) * slotWidth;
      ctx.fillStyle = '#6b7280';
      ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(week, cx, PADDING.top + chartHeight + 10);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${data.newCounts[wi]}명`, cx, PADDING.top + chartHeight + 26);
    });

    // 범례
    const legendItems: { color: string; label: string }[] = [
      { color: '#10b981', label: '40% 이상' },
      { color: '#f59e0b', label: '20~40%' },
      { color: '#ef4444', label: '20% 미만' },
      { color: 'rgba(219,234,254,0.7)', label: '분석기간(A)' },
      { color: 'rgba(254,226,226,0.7)', label: '비교기간(B)' },
    ];
    let lx = PADDING.left;
    const ly = height - 14;
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    legendItems.forEach(({ color, label }) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 0.5;
      ctx.fillRect(lx, ly - 8, 14, 10);
      ctx.strokeRect(lx, ly - 8, 14, 10);
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + 18, ly - 3);
      lx += 110;
    });

    setTimeout(() => resolve(canvas.toDataURL('image/png')), 100);
  });
}
