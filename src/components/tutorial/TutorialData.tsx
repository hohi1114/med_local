export const compareAvenueTutorialSteps = (refs: any) => [
  {
    title: "기준 기간 선택",
    description:
      "먼저 분석 기준이 될 기간을 선택해 주세요. 이후 비교할 기간과의 차이를 확인할 수 있어요.",
    targetRef: refs.tutorialRef1,
    boxPosition: "50%"
  },
  {
    title: "비교 기간 선택",
    description:
      "기준 기간과 비교하고 싶은 다른 기간을 선택해 주세요. 두 기간의 매출 차이를 시각적으로 확인할 수 있어요.",
    targetRef: refs.tutorialRef2,
    boxPosition: "50%"
  },
  {
    title: "매출 증감 지도 확인",
    description:
      "선택한 두 기간의 매출 증감률이 지도에 색상으로 표시돼요. 빨간색은 감소, 파란색은 증가를 의미합니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "기간별 상세 리포트",
    description:
      "지도를 클릭하면 해당 지역의 매출 변화에 대한 상세 리포트를 확인할 수 있어요.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "비교 리포트 튜토리얼 완료!",
    description:
      "이제 지역별 분석으로 넘어가 더욱 심화된 인사이트를 확인해 보세요.",
    specialBackground: true,
    targetRef: null,
    boxPosition: "30%"
  }
];

export const MapByRegionTutorialSteps = (refs: any) => [
  {
    title: "분석 기간 설정",
    description:
      "기본 날짜는 마지막 업데이트일 기준으로 1개월 전 입니다. 직접 원하는 기간을 선택할 수도 있어요.",
    targetRef: refs.tutorialRef1,
    boxPosition: "50%"
  },
  {
    title: "수익 기반 색상 시각화",
    description:
      "지도에 표시된 각 지역은 수익 수준에 따라 색상 농도가 다르게 표현되어, 한눈에 비교가 가능합니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "지역 단위 조정",
    description:
      "지도를 확대하거나 축소하면, 표시되는 지역 단위가 소구역 → 동 → 구 단위로 자동 전환됩니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "소구역 지역 단위",
    description:
      "지도를 확대하면 소구역 단위로 전환되며 환자 유입 분포를 확인할 수 있습니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "동 지역 단위",
    description: "지도를 축소하면 동 단위로 전환된 지도를 확인 할 수 있습니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "구 지역 단위",
    description:
      "지도를 더 축소하면 구 단위로 전환된 지도를 확인 할 수 있습니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "지역별 상세 리포트",
    description:
      "지도를 클릭하면 해당 지역의 자세한 정보와 매출 데이터를 확인할 수 있습니다.",
    targetRef: null,
    specialBackground: true,
    boxPosition: "30%"
  },
  {
    title: "분석 튜토리얼 완료!",
    description:
      "이제 지역 별 통계로 넘어가 더욱 심화된 인사이트를 확인해 보세요.",
    specialBackground: true,
    targetRef: null,
    boxPosition: "30%"
  }
];

export const DashboardSteps = (refs: any) => [
  {
    description: (
      <>
        기본 날짜는 <b>마지막 업데이트일 기준으로 1개월 전</b>이며,
        <b>빠른 선택 버튼</b> 또는 <b>직접 선택</b>으로 원하는 기간을 지정할 수
        있습니다.
      </>
    ),
    targetRef: refs.tutorialRef1
  },
  {
    description: (
      <>
        이곳에서는 <b>전체 통계 요약</b>을 확인할 수 있어요. 매출, 환자 수 등
        주요 지표를 빠르게 파악할 수 있습니다.
      </>
    ),
    targetRef: refs.tutorialRef2
  },
  {
    description: (
      <>
        <b>일자별 매출 추이</b>를 그래프로 확인해보세요. 한눈에 매출 흐름을
        파악하고, 특정 날짜를 비교할 수 있습니다.
      </>
    ),
    targetRef: refs.tutorialRef3
  },
  {
    description: (
      <>
        <b>지역별 매출 순위</b>와 <b>연령대별 환자 분포</b>를 통해 어떤 지역,
        어떤 연령대가 핵심 타겟인지 확인해보세요.
      </>
    ),
    targetRef: refs.tutorialRef4
  }
];

export const StatisticsByRegionPageSteps = (refs: any) => [
  {
    description: (
      <>
        기본 날짜는 <b>최근 업데이트일 기준으로 1개월 전</b>이며, 지역은{" "}
        <b>소구역, 군, 구</b> 단위로 자유롭게 선택할 수 있어요.
      </>
    ),
    targetRef: refs.tutorialRef1
  },
  {
    description: (
      <>
        각 컬럼은 클릭하면 <b>오름차순 혹은 내림차순</b>으로 정렬할 수 있어요.
      </>
    ),
    targetRef: refs.tutorialRef2
  }
];
