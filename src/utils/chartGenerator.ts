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
    const height = 600;
    canvas.width = width;
    canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context를 가져올 수 없습니다.');
      }

    // 여백 설정
    const padding = { top: 60, right: 100, bottom: 60, left: 100 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

      // 데이터 추출
    const revenues = data.map((d) => d.revenue);
    const newPatients = data.map((d) => d.newPatients);
    const maxRevenue = Math.max(...revenues);
    const maxNewPatients = Math.max(...newPatients);

      console.log('📊 Chart Data:', data);
    console.log('💰 Max Revenue:', maxRevenue);
    console.log('👥 Max New Patients:', maxNewPatients);

    // 제목 - 1.3배 증가
    ctx.fillStyle = '#000';
    ctx.font = 'bold 29px sans-serif'; // 22px * 1.3
    ctx.textAlign = 'center';
    ctx.fillText('주별 유입 추이 (Weekly Inflow & Revenue Trend)', width / 2, 30);

    // X축 간격
    const barWidth = chartWidth / data.length;
    const barPadding = barWidth * 0.2;

    // Bar 차트 그리기 (Revenue)
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barPadding;
      const barHeight = (item.revenue / maxRevenue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      ctx.fillStyle = '#FAD7A0';
      ctx.fillRect(x, y, barWidth - barPadding * 2, barHeight);
    });

    // Line 차트 그리기 (New Patients) - 선과 점을 분리하여 그리기
    // 먼저 선을 한 번에 그리기
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 5;
    ctx.beginPath();

    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const lineHeight = (item.newPatients / maxNewPatients) * chartHeight;
      const y = padding.top + chartHeight - lineHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // 그 다음 점을 따로 그리기 (선에 영향을 주지 않게)
    ctx.fillStyle = '#3498DB';
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const lineHeight = (item.newPatients / maxNewPatients) * chartHeight;
      const y = padding.top + chartHeight - lineHeight;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // X축 레이블 - 1.3배 증가
    ctx.fillStyle = '#666';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.textAlign = 'center';
    data.forEach((item, index) => {
      const x = padding.left + index * barWidth + barWidth / 2;
      const y = padding.top + chartHeight + 30;
      ctx.fillText(item.week, x, y);
    });

    // Y축 (Revenue - 왼쪽) - 1.3배 증가
    ctx.fillStyle = '#E67E22';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.textAlign = 'right';
    ctx.save();
    ctx.translate(40, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Revenue (KRW)', 0, 0);
    ctx.restore();

    // Y축 눈금 (Revenue) - 깔끔한 단위로 반올림
    const revenueSteps = 5;
    // 최대값을 적절한 단위로 반올림
    let revenueUnit: number;
    if (maxRevenue < 1000000) {
      revenueUnit = 100000; // 10만원 단위
    } else if (maxRevenue < 10000000) {
      revenueUnit = 1000000; // 100만원 단위
    } else if (maxRevenue < 100000000) {
      revenueUnit = 10000000; // 1천만원 단위
    } else {
      revenueUnit = 50000000; // 5천만원 단위
    }
    const roundedMaxRevenue = Math.ceil(maxRevenue / revenueUnit) * revenueUnit;

    for (let i = 0; i <= revenueSteps; i++) {
      const value = (roundedMaxRevenue / revenueSteps) * i;
      const displayY = padding.top + chartHeight - (chartHeight / revenueSteps) * i;

      ctx.fillStyle = '#E67E22';
      ctx.font = 'bold 20px sans-serif'; // 15px * 1.3
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('ko-KR').format(value),
        padding.left - 10,
        displayY + 4
      );

      // 격자선
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, displayY);
      ctx.lineTo(padding.left + chartWidth, displayY);
      ctx.stroke();
    }

    // Y축 (New Patients - 오른쪽) - 1.3배 증가
    ctx.fillStyle = '#3498DB';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.save();
    ctx.translate(width - 40, height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('New Patients', 0, 0);
    ctx.restore();

    // Y축 눈금 (New Patients) - 5 또는 10 단위로 반올림
    const patientsSteps = 5;
    let patientsUnit: number;
    if (maxNewPatients < 50) {
      patientsUnit = 5; // 5명 단위
    } else if (maxNewPatients < 100) {
      patientsUnit = 10; // 10명 단위
    } else if (maxNewPatients < 500) {
      patientsUnit = 50; // 50명 단위
    } else {
      patientsUnit = 100; // 100명 단위
    }
    const roundedMaxPatients = Math.ceil(maxNewPatients / patientsUnit) * patientsUnit;

    for (let i = 0; i <= patientsSteps; i++) {
      const value = (roundedMaxPatients / patientsSteps) * i;
      const displayY = padding.top + chartHeight - (chartHeight / patientsSteps) * i;

      ctx.fillStyle = '#3498DB';
      ctx.font = 'bold 20px sans-serif'; // 15px * 1.3
      ctx.textAlign = 'left';
      ctx.fillText(
        value.toString(),
        padding.left + chartWidth + 10,
        displayY + 4
      );
    }

    // X축 선
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // 범례 - 더 크게
    const legendY = padding.top - 20;

    // Revenue 범례
    ctx.fillStyle = '#FAD7A0';
    ctx.fillRect(padding.left, legendY, 20, 15);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.textAlign = 'left';
    ctx.fillText('Revenue', padding.left + 25, legendY + 12);

    // New Patients 범례
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(padding.left + 120, legendY + 7);
    ctx.lineTo(padding.left + 140, legendY + 7);
    ctx.stroke();
    ctx.fillStyle = '#3498DB';
    ctx.beginPath();
    ctx.arc(padding.left + 130, legendY + 7, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.fillText('New Patients', padding.left + 145, legendY + 12);

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
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 여백 설정
    const padding = { top: 80, right: 60, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // 연령대 배열
    const ageGroups = ['0', '10', '20', '30', '40', '50', '60', '70+'];
    const chartLabels = ageGroups.map((age) => (age === '70+' ? '70+' : `${age}대`));

    // 데이터 추출
    const chartDataA = ageGroups.map((age) => data.periodA[age] || 0);
    const chartDataB = ageGroups.map((age) => data.periodB[age] || 0);

    // 최대값 계산
    const maxValue = Math.max(...chartDataA, ...chartDataB);

    console.log('📊 Age Analysis - Max Value:', maxValue);

    // 제목
    ctx.fillStyle = '#000';
    ctx.font = 'bold 23px sans-serif'; // 18px * 1.3
    ctx.textAlign = 'center';
    ctx.fillText('연령대별 신환 유입 추이 (A vs B)', width / 2, 30);

    // 그룹 간격
    const groupWidth = chartWidth / ageGroups.length;
    const barWidth = groupWidth * 0.35;

    // Bar 차트 그리기
    ageGroups.forEach((age, index) => {
      const x = padding.left + index * groupWidth;

      // B(비교 기간) - 회색
      const heightB = (chartDataB[index] / maxValue) * chartHeight;
      const yB = padding.top + chartHeight - heightB;
      ctx.fillStyle = '#D9D9D9';
      ctx.fillRect(x + groupWidth * 0.1, yB, barWidth, heightB);

      // A(분석 기간) - 파란색
      const heightA = (chartDataA[index] / maxValue) * chartHeight;
      const yA = padding.top + chartHeight - heightA;
      ctx.fillStyle = '#A7D3F2';
      ctx.fillRect(x + groupWidth * 0.1 + barWidth + 5, yA, barWidth, heightA);
    });

    // X축 레이블 - 1.3배 증가
    ctx.fillStyle = '#666';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.textAlign = 'center';
    chartLabels.forEach((label, index) => {
      const x = padding.left + index * groupWidth + groupWidth / 2;
      const y = padding.top + chartHeight + 30;
      ctx.fillText(label, x, y);
    });

    // Y축 레이블 - 1.3배 증가
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.save();
    ctx.translate(30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Patient Count', 0, 0);
    ctx.restore();

    // Y축 눈금 - 5 또는 10 단위로 반올림
    const steps = 5;
    let unit: number;
    if (maxValue < 50) {
      unit = 5; // 5명 단위
    } else if (maxValue < 100) {
      unit = 10; // 10명 단위
    } else if (maxValue < 500) {
      unit = 50; // 50명 단위
    } else if (maxValue < 1000) {
      unit = 100; // 100명 단위
                    } else {
      unit = 500; // 500명 단위
    }
    const roundedMaxValue = Math.ceil(maxValue / unit) * unit;

    for (let i = 0; i <= steps; i++) {
      const value = (roundedMaxValue / steps) * i;
      const y = padding.top + chartHeight - (chartHeight / steps) * i;

      ctx.fillStyle = '#666';
      ctx.font = 'bold 17px sans-serif'; // 13px * 1.3
      ctx.textAlign = 'right';
      ctx.fillText(
        new Intl.NumberFormat('ko-KR').format(value),
        padding.left - 10,
        y + 4
      );

      // 격자선
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // X축 선
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // 범례 - 더 크게, 왼쪽으로 이동하여 잘리지 않게
    const legendX = width - padding.right - 300; // 200에서 300으로 변경하여 더 왼쪽으로
    const legendY = padding.top - 30;

    // B(비교 기간)
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(legendX, legendY, 20, 15);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.textAlign = 'left';
    ctx.fillText('B(비교 기간)', legendX + 25, legendY + 12);

    // A(분석 기간)
    ctx.fillStyle = '#A7D3F2';
    ctx.fillRect(legendX + 120, legendY, 20, 15);
    ctx.fillStyle = '#000';
    ctx.fillText('A(분석 기간)', legendX + 145, legendY + 12);

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
 * 주별 연령대 분포 Heatmap + 하단 테이블 이미지를 생성하고 Base64로 반환
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
    const height = 750; // 테이블 제거로 높이 감소
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 80, right: 120, bottom: 60, left: 120 };
    const HEATMAP_HEIGHT = 600; // 테이블 제거로 높이 증가
    const TITLE_FONT = 'bold 42px sans-serif'; // 32px * 1.3
    const AXIS_LABEL_FONT = 'bold 30px sans-serif'; // 23px * 1.3
    const CELL_TEXT_FONT = 'bold 30px sans-serif'; // 23px * 1.3

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // 제목
    ctx.fillStyle = '#000';
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('주별 신환 추이', width / 2, 40);

    // Heatmap 영역 계산
    const heatmapWidth = width - PADDING.left - PADDING.right;
    const heatmapStartY = PADDING.top;
    const heatmapEndY = heatmapStartY + HEATMAP_HEIGHT;

    // 최대값 계산
    const maxValue = Math.max(
      ...data.matrix.flatMap((row) => row)
    );

    // 색상 매핑 함수 (연한 노랑 -> 진한 남색)
    const getColor = (value: number, max: number): string => {
      if (max === 0) return '#FFF9C4'; // 연한 노랑
      const ratio = value / max;
      
      // RGB 값 계산: 연한 노랑(#FFF9C4) -> 진한 남색(#1565C0)
      const r1 = 255, g1 = 249, b1 = 196; // #FFF9C4
      const r2 = 21, g2 = 101, b2 = 192;  // #1565C0
      
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      
      return `rgb(${r}, ${g}, ${b})`;
    };

    // 텍스트 색상 결정 함수 (가독성)
    const getTextColor = (value: number, max: number): string => {
      if (max === 0) return '#000';
      const ratio = value / max;
      // 중간값(약 0.5) 이상이면 흰색, 이하면 검정
      return ratio > 0.5 ? '#FFFFFF' : '#000000';
    };

    // Heatmap 그리기
    const cellWidth = heatmapWidth / data.ages.length;
    const cellHeight = HEATMAP_HEIGHT / data.weeks.length;

    data.weeks.forEach((week, weekIdx) => {
      const periodLabel = data.periodLabels?.[weekIdx];
      
      data.ages.forEach((age, ageIdx) => {
        const value = data.matrix[weekIdx]?.[ageIdx] || 0;
        const x = PADDING.left + ageIdx * cellWidth;
        const y = heatmapStartY + weekIdx * cellHeight;

        // 셀 배경색
        ctx.fillStyle = getColor(value, maxValue);
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // 기간 구분을 위한 테두리 (A=초록, B=빨강)
        if (periodLabel === 'A') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
        } else if (periodLabel === 'B') {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = '#ddd';
          ctx.lineWidth = 1;
        }
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // 숫자 표시
        ctx.fillStyle = getTextColor(value, maxValue);
        ctx.font = CELL_TEXT_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          value.toString(),
          x + cellWidth / 2,
          y + cellHeight / 2
        );
      });
    });

    // Y축 레이블 (weeks) - 더 크게
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT; // 18px
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    data.weeks.forEach((week, weekIdx) => {
      const y = heatmapStartY + weekIdx * cellHeight + cellHeight / 2;
      ctx.fillText(week, PADDING.left - 10, y);
    });

    // X축 레이블 (ages) - 더 크게
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT; // 18px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.ages.forEach((age, ageIdx) => {
      const x = PADDING.left + ageIdx * cellWidth + cellWidth / 2;
      const y = heatmapEndY + 10;
      const label = age === '70+' ? '70+' : `${age}대`;
      ctx.fillText(label, x, y);
    });

    // Colorbar 그리기
    const colorbarWidth = 30;
    const colorbarHeight = HEATMAP_HEIGHT;
    const colorbarX = width - PADDING.right + 20;
    const colorbarY = heatmapStartY;

    // 그라데이션 바
    const gradientSteps = 100;
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / (gradientSteps - 1);
      const value = ratio * maxValue;
      ctx.fillStyle = getColor(value, maxValue);
      ctx.fillRect(
        colorbarX,
        colorbarY + (1 - ratio) * colorbarHeight,
        colorbarWidth,
        colorbarHeight / gradientSteps
      );
    }

    // Colorbar 테두리
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.strokeRect(colorbarX, colorbarY, colorbarWidth, colorbarHeight);

    // Colorbar 눈금 및 레이블 - 1.3배 증가
    const tickCount = 5;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= tickCount; i++) {
      const ratio = i / tickCount;
      const value = ratio * maxValue;
      const tickY = colorbarY + (1 - ratio) * colorbarHeight;
      
      // 눈금선
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(colorbarX - 5, tickY);
      ctx.lineTo(colorbarX, tickY);
      ctx.stroke();
      
      // 숫자 레이블
      ctx.fillText(
        Math.round(value).toString(),
        colorbarX + colorbarWidth + 8,
        tickY
      );
    }

    // Colorbar 제목
    ctx.save();
    ctx.translate(colorbarX + colorbarWidth / 2, heatmapStartY + colorbarHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Patient Count', 0, 0);
    ctx.restore();

    // 범례 추가 (A/B 기간 구분) - 표와 겹치지 않게 더 아래로, 범례 간격 확보
    if (data.periodLabels && data.periodLabels.some(p => p === 'A' || p === 'B')) {
      const legendX = width - PADDING.right - 250;
      const legendY = heatmapEndY + 50; // 20에서 50으로 증가하여 표와의 간격 확보

      // A 기간 범례
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(legendX, legendY, 20, 15);
      ctx.fillStyle = '#000';
      ctx.font = AXIS_LABEL_FONT; // 18px
      ctx.textAlign = 'left';
      ctx.fillText('A(분석 기간)', legendX + 25, legendY + 12);

      // B 기간 범례 - 간격을 더 넓게
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(legendX + 150, legendY, 20, 15); // 120에서 150으로 증가
      ctx.fillStyle = '#000';
      ctx.font = AXIS_LABEL_FONT; // 18px
      ctx.fillText('B(비교 기간)', legendX + 175, legendY + 12); // 145에서 175로 증가
    }

    // Base64 변환
      setTimeout(() => {
          const base64Image = canvas.toDataURL('image/png');
          resolve(base64Image);
    }, 100);
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
    const height = 650;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 80, right: 80, bottom: 60, left: 170 };
    const TITLE_FONT = 'bold 29px sans-serif'; // 22px * 1.3
    const SUBTITLE_FONT = 'bold 21px sans-serif'; // 16px * 1.3
    const AXIS_LABEL_FONT = 'bold 21px sans-serif'; // 16px * 1.3
    const AREA_LABEL_FONT = 'bold 20px sans-serif'; // 15px * 1.3
    const VALUE_FONT = 'bold 18px sans-serif'; // 14px * 1.3
    const LEGEND_FONT = 'bold 18px sans-serif'; // 14px * 1.3

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // periodA 내림차순 정렬
    const sortedData = [...data].sort((a, b) => b.periodA - a.periodA);

    // 최대값 계산
    const maxValue = Math.max(
      ...sortedData.flatMap(d => [d.periodA, d.periodB])
    );

    // 제목
    ctx.fillStyle = '#000';
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('지역별 신환 유입 추이', width / 2, 30);

    // 부제
    ctx.font = SUBTITLE_FONT;
    ctx.fillText('New Patients by Area (A vs B)', width / 2, 55);

    // 차트 영역 계산
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const rowHeight = chartHeight / sortedData.length;
    const barOffset = rowHeight * 0.15; // 막대를 위/아래로 분리하기 위한 오프셋

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

    // X축 눈금 및 그리드선 그리기
    for (let i = 0; i <= xAxisSteps; i++) {
      const value = (roundedMaxValue / xAxisSteps) * i;
      const x = PADDING.left + (value / roundedMaxValue) * chartWidth;

      // 그리드선
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, PADDING.top + chartHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // 눈금 레이블
      ctx.fillStyle = '#666';
      ctx.font = AXIS_LABEL_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(
        new Intl.NumberFormat('ko-KR').format(value),
        x,
        PADDING.top + chartHeight + 10
      );
    }

    // X축 선
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top + chartHeight);
    ctx.lineTo(PADDING.left + chartWidth, PADDING.top + chartHeight);
    ctx.stroke();

    // X축 라벨
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Patient Count', width / 2, height - 20);

    // 막대 차트 그리기
    sortedData.forEach((item, index) => {
      const y = PADDING.top + index * rowHeight + rowHeight / 2;

      // B(비교 기간) 막대 - 위쪽
      const barWidthB = (item.periodB / roundedMaxValue) * chartWidth;
      const barY_B = y - barOffset - 12;
      ctx.fillStyle = '#D9D9D9';
      ctx.fillRect(PADDING.left, barY_B, barWidthB, 24);

      // B 막대 값 텍스트
      if (barWidthB > 30) {
        ctx.fillStyle = '#000';
        ctx.font = VALUE_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          new Intl.NumberFormat('ko-KR').format(item.periodB),
          PADDING.left + barWidthB + 5,
          barY_B + 12
        );
      }

      // A(분석 기간) 막대 - 아래쪽
      const barWidthA = (item.periodA / roundedMaxValue) * chartWidth;
      const barY_A = y + barOffset - 12;
      ctx.fillStyle = '#1F8A83';
      ctx.fillRect(PADDING.left, barY_A, barWidthA, 24);

      // A 막대 값 텍스트
      if (barWidthA > 30) {
        ctx.fillStyle = '#000';
        ctx.font = VALUE_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          new Intl.NumberFormat('ko-KR').format(item.periodA),
          PADDING.left + barWidthA + 5,
          barY_A + 12
        );
      }

      // Y축 지역명 라벨
      ctx.fillStyle = '#000';
      ctx.font = AREA_LABEL_FONT;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.area, PADDING.left - 10, y);
    });

    // 범례 (우측 상단)
    const legendX = width - PADDING.right - 150;
    const legendY = PADDING.top - 30;

    // B(비교 기간) 범례
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(legendX, legendY, 20, 15);
    ctx.fillStyle = '#000';
    ctx.font = LEGEND_FONT;
    ctx.textAlign = 'left';
    ctx.fillText('B(비교 기간)', legendX + 25, legendY + 12);

    // A(분석 기간) 범례
    ctx.fillStyle = '#1F8A83';
    ctx.fillRect(legendX + 120, legendY, 20, 15);
    ctx.fillStyle = '#000';
    ctx.fillText('A(분석 기간)', legendX + 145, legendY + 12);

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

/**
 * 주별 지역별 신환 유입 히트맵 차트를 생성하고 Base64 이미지로 반환
 *
 * @param data 주별 지역별 데이터
 * @returns Base64 인코딩된 이미지 Data URL
 */
export async function generateWeeklyRegionHeatmapChart(
  data: WeeklyRegionHeatmapData
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 750;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 80, right: 120, bottom: 60, left: 140 };
    const HEATMAP_HEIGHT = 600;
    const TITLE_FONT = 'bold 42px sans-serif'; // 32px * 1.3
    const SUBTITLE_FONT = 'bold 23px sans-serif'; // 18px * 1.3
    const AXIS_LABEL_FONT = 'bold 26px sans-serif'; // 20px * 1.3
    const CELL_TEXT_FONT = 'bold 26px sans-serif'; // 20px * 1.3

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // 제목
    ctx.fillStyle = '#000';
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('주별 신환 유입 추이', width / 2, 35);

    // 부제
    ctx.font = SUBTITLE_FONT;
    ctx.fillText('Heatmap 2: Weekly New Patient Inflow by Area', width / 2, 60);

    // Heatmap 영역 계산
    const heatmapWidth = width - PADDING.left - PADDING.right;
    const heatmapStartY = PADDING.top;
    const heatmapEndY = heatmapStartY + HEATMAP_HEIGHT;

    // 최대값 계산
    const maxValue = Math.max(
      ...data.matrix.flatMap((row) => row)
    );

    // 색상 매핑 함수 (연한 노랑 -> 진한 빨강)
    const getColor = (value: number, max: number): string => {
      if (max === 0) return '#FFF9C4';
      const ratio = value / max;

      // RGB 값 계산: 연한 노랑(#FFFDE7) -> 진한 빨강(#B71C1C)
      const r1 = 255, g1 = 253, b1 = 231; // #FFFDE7
      const r2 = 183, g2 = 28, b2 = 28;   // #B71C1C

      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);

      return `rgb(${r}, ${g}, ${b})`;
    };

    // 텍스트 색상 결정 함수
    const getTextColor = (value: number, max: number): string => {
      if (max === 0) return '#000';
      const ratio = value / max;
      return ratio > 0.5 ? '#FFFFFF' : '#000000';
    };

    // Heatmap 그리기 (regions x weeks)
    const cellWidth = heatmapWidth / data.weeks.length;
    const cellHeight = HEATMAP_HEIGHT / data.regions.length;

    data.regions.forEach((region, regionIdx) => {
      data.weeks.forEach((week, weekIdx) => {
        const value = data.matrix[regionIdx]?.[weekIdx] || 0;
        const x = PADDING.left + weekIdx * cellWidth;
        const y = heatmapStartY + regionIdx * cellHeight;

        // 셀 배경색
        ctx.fillStyle = getColor(value, maxValue);
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // 테두리
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // 숫자 표시
        ctx.fillStyle = getTextColor(value, maxValue);
        ctx.font = CELL_TEXT_FONT;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          value.toString(),
          x + cellWidth / 2,
          y + cellHeight / 2
        );
      });
    });

    // Y축 레이블 (regions)
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    data.regions.forEach((region, regionIdx) => {
      const y = heatmapStartY + regionIdx * cellHeight + cellHeight / 2;
      ctx.fillText(region, PADDING.left - 10, y);
    });

    // X축 레이블 (weeks)
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, weekIdx) => {
      const x = PADDING.left + weekIdx * cellWidth + cellWidth / 2;
      const y = heatmapEndY + 10;
      ctx.fillText(week, x, y);
    });

    // Colorbar 그리기
    const colorbarWidth = 30;
    const colorbarHeight = HEATMAP_HEIGHT;
    const colorbarX = width - PADDING.right + 20;
    const colorbarY = heatmapStartY;

    // 그라데이션 바
    const gradientSteps = 100;
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / (gradientSteps - 1);
      const value = ratio * maxValue;
      ctx.fillStyle = getColor(value, maxValue);
      ctx.fillRect(
        colorbarX,
        colorbarY + (1 - ratio) * colorbarHeight,
        colorbarWidth,
        colorbarHeight / gradientSteps
      );
    }

    // Colorbar 테두리
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbarX, colorbarY, colorbarWidth, colorbarHeight);

    // Colorbar 레이블 (상단, 중간, 하단)
    ctx.fillStyle = '#333';
    ctx.font = 'bold 21px sans-serif'; // 16px * 1.3
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxValue.toString(), colorbarX + colorbarWidth + 5, colorbarY);
    ctx.fillText(Math.round(maxValue / 2).toString(), colorbarX + colorbarWidth + 5, colorbarY + colorbarHeight / 2);
    ctx.fillText('0', colorbarX + colorbarWidth + 5, colorbarY + colorbarHeight);

    // "Count" 레이블
    ctx.save();
    ctx.translate(colorbarX + colorbarWidth + 50, colorbarY + colorbarHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Count', 0, 0);
    ctx.restore();

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}

interface WeeklyAreaConcentrationData {
  weeks: string[];
  top3Counts: number[];      // 각 주의 TOP3 동 합계
  top7Counts: number[];      // 각 주의 Sub4 동 합계 (4~7위)
  top3Ratios: number[];      // 각 주의 TOP3 비율 (%)
  top7Ratios: number[];      // 각 주의 Sub4 비율 (%)
}

/**
 * 주별 유입 추이 (TOP3 vs Sub4 + 집중도) 히트맵 차트 생성
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
    const height = 850;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // 상수 설정
    const PADDING = { top: 80, right: 120, bottom: 60, left: 140 };
    const HEATMAP_HEIGHT = 300;
    const GAP_BETWEEN = 50;
    const TITLE_FONT = 'bold 36px sans-serif'; // 28px * 1.3
    const SUBTITLE_FONT = 'bold 21px sans-serif'; // 16px * 1.3
    const AXIS_LABEL_FONT = 'bold 23px sans-serif'; // 18px * 1.3
    const CELL_TEXT_FONT = 'bold 23px sans-serif'; // 18px * 1.3

    // 배경색
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // 메인 제목
    ctx.fillStyle = '#000';
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('주별 유입 추이', width / 2, 40);

    // ===============================
    // Heatmap 1: TOP3/TOP7 신환 수
    // ===============================
    const heatmap1StartY = PADDING.top;
    const heatmap1EndY = heatmap1StartY + HEATMAP_HEIGHT;

    // 부제목 1
    ctx.font = SUBTITLE_FONT;
    ctx.fillText('Heatmap 3: Weekly Patient Inflow Trend (TOP 3 vs Sub 4)', width / 2, heatmap1StartY - 10);

    const heatmapWidth = width - PADDING.left - PADDING.right;
    const cellWidth = heatmapWidth / data.weeks.length;
    const cellHeightCount = HEATMAP_HEIGHT / 2;

    // 최대값 계산 (Count)
    const maxCount = Math.max(...data.top3Counts, ...data.top7Counts);

    // 색상 매핑 함수 (Count: 연한 하늘 -> 진한 파랑)
    const getCountColor = (value: number, max: number): string => {
      if (max === 0) return '#E3F2FD';
      const ratio = value / max;
      const r1 = 227, g1 = 242, b1 = 253; // #E3F2FD (연한 하늘)
      const r2 = 13, g2 = 71, b2 = 161;   // #0D47A1 (진한 파랑)
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // 텍스트 색상 결정
    const getTextColor = (ratio: number): string => {
      return ratio > 0.5 ? '#FFFFFF' : '#000000';
    };

    // TOP 3 Dongs 행
    data.weeks.forEach((week, weekIdx) => {
      const value = data.top3Counts[weekIdx];
      const x = PADDING.left + weekIdx * cellWidth;
      const y = heatmap1StartY;

      ctx.fillStyle = getCountColor(value, maxCount);
      ctx.fillRect(x, y, cellWidth, cellHeightCount);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeightCount);

      ctx.fillStyle = getTextColor(value / maxCount);
      ctx.font = CELL_TEXT_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), x + cellWidth / 2, y + cellHeightCount / 2);
    });

    // Sub 4 Dongs 행
    data.weeks.forEach((week, weekIdx) => {
      const value = data.top7Counts[weekIdx];
      const x = PADDING.left + weekIdx * cellWidth;
      const y = heatmap1StartY + cellHeightCount;

      ctx.fillStyle = getCountColor(value, maxCount);
      ctx.fillRect(x, y, cellWidth, cellHeightCount);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeightCount);

      ctx.fillStyle = getTextColor(value / maxCount);
      ctx.font = CELL_TEXT_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toString(), x + cellWidth / 2, y + cellHeightCount / 2);
    });

    // Y축 레이블 (Heatmap 1)
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOP 3 Dongs', PADDING.left - 10, heatmap1StartY + cellHeightCount / 2);
    ctx.fillText('Sub 4 Dongs', PADDING.left - 10, heatmap1StartY + cellHeightCount + cellHeightCount / 2);

    // Colorbar 1 (Count)
    const colorbar1X = width - PADDING.right + 20;
    const colorbar1Width = 25;

    for (let i = 0; i < 100; i++) {
      const ratio = i / 99;
      ctx.fillStyle = getCountColor(ratio * maxCount, maxCount);
      ctx.fillRect(
        colorbar1X,
        heatmap1EndY - (ratio * HEATMAP_HEIGHT),
        colorbar1Width,
        HEATMAP_HEIGHT / 100 + 1
      );
    }
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbar1X, heatmap1StartY, colorbar1Width, HEATMAP_HEIGHT);

    // Colorbar 1 레이블
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxCount.toString(), colorbar1X + colorbar1Width + 5, heatmap1StartY);
    ctx.fillText(Math.round(maxCount / 2).toString(), colorbar1X + colorbar1Width + 5, heatmap1StartY + HEATMAP_HEIGHT / 2);
    ctx.fillText('0', colorbar1X + colorbar1Width + 5, heatmap1EndY);

    // "Count" 레이블
    ctx.save();
    ctx.translate(colorbar1X + colorbar1Width + 55, heatmap1StartY + HEATMAP_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Count', 0, 0);
    ctx.restore();

    // ===============================
    // Heatmap 2: TOP3/TOP7 비율
    // ===============================
    const heatmap2StartY = heatmap1EndY + GAP_BETWEEN;
    const heatmap2EndY = heatmap2StartY + HEATMAP_HEIGHT;

    // 부제목 2
    ctx.fillStyle = '#000';
    ctx.font = SUBTITLE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Heatmap 4: Weekly Area Concentration Ratio (%)', width / 2, heatmap2StartY - 10);

    // 최대/최소 비율 계산
    const allRatios = [...data.top3Ratios, ...data.top7Ratios];
    const minRatio = Math.min(...allRatios);
    const maxRatio = Math.max(...allRatios);

    // 색상 매핑 함수 (Ratio: 연한 노랑 -> 진한 빨강)
    const getRatioColor = (value: number, min: number, max: number): string => {
      if (max === min) return '#FFF9C4';
      const ratio = (value - min) / (max - min);
      const r1 = 255, g1 = 249, b1 = 196; // #FFF9C4 (연한 노랑)
      const r2 = 183, g2 = 28, b2 = 28;   // #B71C1C (진한 빨강)
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const getRatioTextColor = (value: number, min: number, max: number): string => {
      if (max === min) return '#000';
      const ratio = (value - min) / (max - min);
      return ratio > 0.5 ? '#FFFFFF' : '#000000';
    };

    // TOP 3 Ratio 행
    data.weeks.forEach((week, weekIdx) => {
      const value = data.top3Ratios[weekIdx];
      const x = PADDING.left + weekIdx * cellWidth;
      const y = heatmap2StartY;

      ctx.fillStyle = getRatioColor(value, minRatio, maxRatio);
      ctx.fillRect(x, y, cellWidth, cellHeightCount);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeightCount);

      ctx.fillStyle = getRatioTextColor(value, minRatio, maxRatio);
      ctx.font = CELL_TEXT_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toFixed(1) + '%', x + cellWidth / 2, y + cellHeightCount / 2);
    });

    // Sub 4 Ratio 행
    data.weeks.forEach((week, weekIdx) => {
      const value = data.top7Ratios[weekIdx];
      const x = PADDING.left + weekIdx * cellWidth;
      const y = heatmap2StartY + cellHeightCount;

      ctx.fillStyle = getRatioColor(value, minRatio, maxRatio);
      ctx.fillRect(x, y, cellWidth, cellHeightCount);

      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellWidth, cellHeightCount);

      ctx.fillStyle = getRatioTextColor(value, minRatio, maxRatio);
      ctx.font = CELL_TEXT_FONT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(value.toFixed(1) + '%', x + cellWidth / 2, y + cellHeightCount / 2);
    });

    // Y축 레이블 (Heatmap 2)
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('TOP 3 Ratio (%)', PADDING.left - 10, heatmap2StartY + cellHeightCount / 2);
    ctx.fillText('Sub 4 Ratio (%)', PADDING.left - 10, heatmap2StartY + cellHeightCount + cellHeightCount / 2);

    // X축 레이블 (weeks) - 두 번째 히트맵 아래에만
    ctx.fillStyle = '#000';
    ctx.font = AXIS_LABEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.weeks.forEach((week, weekIdx) => {
      const x = PADDING.left + weekIdx * cellWidth + cellWidth / 2;
      const y = heatmap2EndY + 10;
      ctx.fillText(week, x, y);
    });

    // Colorbar 2 (Ratio)
    const colorbar2X = width - PADDING.right + 20;

    for (let i = 0; i < 100; i++) {
      const ratio = i / 99;
      const value = minRatio + ratio * (maxRatio - minRatio);
      ctx.fillStyle = getRatioColor(value, minRatio, maxRatio);
      ctx.fillRect(
        colorbar2X,
        heatmap2EndY - (ratio * HEATMAP_HEIGHT),
        colorbar1Width,
        HEATMAP_HEIGHT / 100 + 1
      );
    }
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(colorbar2X, heatmap2StartY, colorbar1Width, HEATMAP_HEIGHT);

    // Colorbar 2 레이블
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px sans-serif'; // 14px * 1.3
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(maxRatio.toFixed(0), colorbar2X + colorbar1Width + 5, heatmap2StartY);
    ctx.fillText(((minRatio + maxRatio) / 2).toFixed(0), colorbar2X + colorbar1Width + 5, heatmap2StartY + HEATMAP_HEIGHT / 2);
    ctx.fillText(minRatio.toFixed(0), colorbar2X + colorbar1Width + 5, heatmap2EndY);

    // "Ratio (%)" 레이블
    ctx.save();
    ctx.translate(colorbar2X + colorbar1Width + 55, heatmap2StartY + HEATMAP_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Ratio (%)', 0, 0);
    ctx.restore();

    // Base64 변환
    setTimeout(() => {
      const base64Image = canvas.toDataURL('image/png');
      resolve(base64Image);
    }, 100);
  });
}
