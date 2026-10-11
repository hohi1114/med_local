/**
 * 주요 이벤트 (플레이스 순위) 섹션 생성
 */

interface KeyEventsParams {
  analyticsHospitalId: string;
}

export const generateKeyEvents = async ({
  analyticsHospitalId,
}: KeyEventsParams): Promise<string> => {
  let html = '<h2>나. 주요 이벤트</h2>';

  if (!analyticsHospitalId) {
    html += `
      <div style="background-color: #fef3c7; padding: 16px; border: 1px solid #f59e0b; border-radius: 8px; margin: 16px 0;">
        <p style="color: #92400e; margin: 0;">
          Analytics DB 병원 ID가 설정되지 않았습니다. 상단에서 병원 ID 매핑을 먼저 진행해주세요.
        </p>
      </div>
    `;
    return html;
  }

  try {
    // TODO: 실제 API 연동 후 데이터 가져오기
    // const response = await fetch(`${API_URL}/analytics/hospital/${analyticsHospitalId}`);
    // const hospitalData = await response.json();

    // 임시 플레이스홀더 - 실제 데이터 연동 후 차트 생성
    html += `
      <div style="background-color: #f0fdf4; padding: 24px; border: 1px solid #86efac; border-radius: 8px; margin: 16px 0;">
        <h3 style="margin: 0 0 16px 0; color: #166534;">[키워드1], [키워드2], [키워드3] 순위 변동 추이</h3>
        <p style="color: #15803d; margin: 0 0 16px 0; font-size: 14px;">
          Analytics DB 병원 ID: <code style="background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${analyticsHospitalId}</code>
        </p>
        <div style="background-color: #fff; padding: 16px; border-radius: 8px; text-align: center; min-height: 200px; display: flex; align-items: center; justify-content: center; border: 1px dashed #86efac;">
          <div>
            <p style="color: #6b7280; margin: 0 0 8px 0;">📊 Naver Place Keyword Ranking Trend (Top 3 Focus)</p>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              place_rank_history 데이터를 기반으로 순위 차트가 여기에 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    `;

    // 순위 변화 요약 테이블 (플레이스홀더)
    html += `
      <h3 style="margin-top: 24px;">키워드별 순위 현황</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th>키워드</th>
            <th>현재 순위</th>
            <th>변동</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>강동구내과</td>
            <td style="text-align: center; font-weight: 600;">1위</td>
            <td style="text-align: center; color: #10b981;">▲1</td>
            <td style="font-size: 13px; color: #6b7280;">12월 25일 1위 회복</td>
          </tr>
          <tr>
            <td>성내동내과</td>
            <td style="text-align: center; font-weight: 600;">1위</td>
            <td style="text-align: center; color: #9ca3af;">-</td>
            <td style="font-size: 13px; color: #6b7280;">유지</td>
          </tr>
          <tr>
            <td>포레온내과</td>
            <td style="text-align: center; font-weight: 600;">1위</td>
            <td style="text-align: center; color: #9ca3af;">-</td>
            <td style="font-size: 13px; color: #6b7280;">유지</td>
          </tr>
        </tbody>
      </table>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
        * 데이터 출처: hospitals.place_rank_history (일간 조회)
      </p>
    `;

    return html;
  } catch (error) {
    console.error('주요 이벤트 생성 오류:', error);
    html += `
      <div style="background-color: #fee2e2; padding: 16px; border: 1px solid #fca5a5; border-radius: 8px; margin: 16px 0;">
        <p style="color: #991b1b; margin: 0;">
          Analytics 데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    `;
    return html;
  }
};
