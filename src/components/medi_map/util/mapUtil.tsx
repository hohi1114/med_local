import { getDataFromRegionDB } from "../../../store/indexded_db/RegionDB";
import { AverageGrowth, TopAgeGrowth } from "../../../types/dashboard";
import { RegionData } from "../../../types/naver-maps";

// ✅ `smallPolygon`을 포함하는 `dong` 찾기
export const findContainingDong = async (
  dongName: string
): Promise<RegionData> => {
  const dongData = await getDataFromRegionDB("dong_regions");

  return dongData.find((dong) => {
    return dong.name === dongName;
  });
};

type GrowthLevel = "high" | "mid" | "low";
type Key = `${GrowthLevel}_${GrowthLevel}_${GrowthLevel}`; // 27개 조합

const getLevel = (n: number): GrowthLevel => {
  if (n >= 10) return "high";
  if (n <= -10) return "low";
  return "mid";
};

const messageMap: Record<Key, string> = {
  // 매출 HIGH
  high_high_high: "신규 유입과 재방문 모두 완벽합니다!",
  high_high_mid:
    "신규 유입은 좋지만, 재방문을 조금 더 늘릴 수 있다면 좋을 것 같아요.",
  high_high_low:
    "신규 유입은 활발하지만 재방문이 부족해요.\n 만족도나 재방문 안내가 아쉬울 수 있어요.",

  high_mid_high:
    "충성도 높은 고객층이 확보된 상태에요.\n 추가 유입을 늘릴 방법을 좀 더 고민해보면 좋을 것 같아요.",
  high_mid_mid: "안정적이고 천천히 성장하고 있어요.",
  high_mid_low: "매출은 성장하고 있지만 기존 고객 이탈이 늘어났어요.",

  high_low_high:
    "재방문은 활발하지만 신규 유입이 눈에 띄게 줄었어요.\n 마케팅 현황을 한번 점검해보시겠어요?",
  high_low_mid: "신환이 많이 줄었고, 재방문도 조금 더 보완이 필요해요.",
  high_low_low:
    "매출은 늘었지만, 신규 유입도 적고 재진율도 낮아서 불안정한 구조에요.\n 전반적인 점검이 필요합니다.",

  // 매출 MID
  mid_high_high:
    "신규 유입과 재방문 모두 활발해요.\n 성장가능성이 높은 지역입니다.",
  mid_high_mid:
    "유입은 높지만 재방문으로 이어지는 비율이 높지 않아요.\n 다음 방문을 조금 더 신경써 보는건 어떨까요?",
  mid_high_low:
    "유입에 비해 재진율이 크게 떨어지고 있어요.\n 내부 점검이 필요할 것 같아요.",

  mid_mid_high:
    "유입은 보통이지만 병원에 대한 신뢰도가 높아요.\n 입소문이나 후기를 통한 신규 유입 전략을 추천 드려요.",
  mid_mid_mid:
    "유입과 재방문 모두 큰 변화가 없어요.\n 새로운 마케팅을 시도해보시는 건 어떨까요?",
  mid_mid_low:
    "유입 대비 재방문이 낮아요.\n 내부 점검을 한번 해보시는 건 어떨까요?",

  mid_low_high:
    "신규 유입만 늘어나면 빠르게 성장할 수 있는 구조에요.\n 마케팅에 적극적으로 나서보세요!",
  mid_low_mid:
    "유입과 재진 모두 흔들리고 있어요.\n 마케팅 상황을 점검해보세요.",
  mid_low_low:
    "유입과 재방문 모두 눈에 띄게 줄었어요.\n 마케팅 현황에 대한 전반적인 점검이 필요합니다.",

  // 매출 LOW
  low_high_high:
    "객단가가 크게 떨어진 것 같아요.\n 상품 구성을 점검해보시는 건 어떨까요?",
  low_high_mid: "유입은 높지만 수익성이 크게 떨어지는 것 같아요.",
  low_high_low:
    "신규 유입 대비 이탈이 많아요.\n 경험 설계 개선이 필요해 보여요.",

  low_mid_high: "충성도 높은 고객은 있지만, 신환 유입이 조금 더 필요해요.",
  low_mid_mid:
    "신규 유입과 재방문율 모두 중간이에요.\n 조금 더 공격적인 마케팅을 해보는건 어떨까요?",
  low_mid_low:
    "재진율이 크게 줄어들었어요.\n 고객 경험에 대한 전반적인 점검이 필요해요",

  low_low_high:
    "충성도는 있지만, 유입이 너무 적어요.\n 마케팅이 환자에게 잘 닿고 있지 않아요.",
  low_low_mid:
    "신환이 크게 줄어 매출이 많이 감소했어요.\n 마케팅 전략의 전반적인 수정이 필요해요.",
  low_low_low:
    "신환과 재진 모두 크게 감소했어요.\n 전면적인 전략 수정이 필요합니다."
};

export const getGrowthMessage = (data: Partial<AverageGrowth>) => {
  const cost = getLevel(data.avg_growth_total_cost ?? 0);
  const sinhwan = getLevel(data.avg_growth_sinhwan ?? 0);
  const revisit = getLevel(data.avg_growth_revisit ?? 0);

  const key: Key = `${cost}_${sinhwan}_${revisit}`;

  return messageMap[key] || "";
};

const getAgeRange = (ageStr: number): "0-20" | "20-40" | "40-60" | "60+" => {
  const age = parseInt(ageStr, 10);
  if (age <= 20) return "0-20";
  if (age < 40) return "20-40";
  if (age <= 60) return "40-60";
  return "60+";
};

const getSummaryMessage = (age: number, percent: number): string => {
  if (percent >= 10)
    return `${
      age === 0 ? "0~10" : age
    }대 환자군이 많이 증가했네요! 좋은 추세에요.`;
  if (percent <= -10) return `${age}대 환자군이 감소하는 추세에요.`;
  return `${age}대 환자군은 안정적인 추이를 보이고 있어요.`;
};

const strategyMap: Record<string, { increase: string; decrease: string }> = {
  "0-20": {
    increase: "학생·청소년층의 내원이 눈에 띄게 늘고 있어요",
    decrease: `청소년층 유입이 눈에 띄게 줄어들고 있어요.\n 1) 부모가 공감할 수 있는 콘텐츠의 비중을 높여보세요.\n2) 학원가·학교 인근 상권을 타겟으로 키워드를 잡아보시면 좋아요.\n3) 자녀를 위한 “믿을 수 있는 병원”이라는 브랜딩이 중요합니다.`
  },
  "20-40": {
    increase: "2, 30대 고객층이 꾸준히 유입되고 있어요.",
    decrease: `2, 30대 젋은 층 유입이 줄어들고 있어요.\n1) SNS·블로그·커뮤니티 등 젊은층이 자주 활용하는 채널의 비중을 늘려보세요.\n2) 직장인 중심 상권 키워드를 반영한 콘텐츠로 검색 유입을 노려보시는 것도 좋습니다.`
  },
  "40-60": {
    increase: "중장년층 고객들이 효과적으로 유입되고 있어요. ",
    decrease: `중장년층 유입이 감소하고 있어요.\n1) 아파트 단지 내 DID광고나 엘리베이터 광고 등을 고려해보세요.\n2) 재방문 유도를 위한 맞춤형 안내 메시지도 함께 활용하시면 좋아요`
  },
  "60+": {
    increase: "60대 이상 고령층 고객들이 꾸준히 내원하고 있어요.",
    decrease: `고령층 유입이 줄어들고 있어요.\n1) 지역별 전단지 등 오프라인 채널 비중을 늘려보세요.\n2) ‘자녀가 부모님을 설득하고 싶게하는’ 콘텐츠가 효과적일 수 있어요.\n3) 실버 커뮤니티나 복지관 등 지역 기관과의 연계도 고려해보시면 좋아요.`
  }
};

export const getGrowthAgeMessage = (
  ageGroup: TopAgeGrowth[]
): {
  age: string;
  summaryMessage: string;
  strategyMessage: string;
  change_percent: number;
}[] => {
  const seen: Record<string, boolean> = {};
  let result: {
    age: string;
    summaryMessage: string;
    strategyMessage: string;
    change_percent: number;
  }[] = [];

  ageGroup.forEach((ageGroup) => {
    if (ageGroup.change_percent === 0) return;

    const range = getAgeRange(ageGroup.age);
    const summaryMessage = getSummaryMessage(
      ageGroup.age,
      ageGroup.change_percent
    );

    let strategyMessage = "";
    if (ageGroup.change_percent >= 10) {
      strategyMessage = strategyMap[range].increase;
    } else if (ageGroup.change_percent <= -10) {
      strategyMessage = strategyMap[range].decrease;
    }

    if (strategyMessage) {
      if (seen[strategyMessage]) {
        strategyMessage = ""; // 중복이면 비움
      } else {
        seen[strategyMessage] = true; // 처음이면 기록
      }
    }

    result.push({
      age: `${ageGroup.age}대`,
      change_percent: ageGroup.change_percent,
      summaryMessage,
      strategyMessage
    });
  });

  return result;
};

//top 20개 지역에대해 진료비, 신환, 재방문 환자수 감소 한개라도 -20% 이라면 Red 표시
//혹은 셋다 15% 이상 증가한 경우에 green 표시
export const needNotify = (
  costRank: number,
  data: Partial<AverageGrowth>
): "none" | "good" | "bad" => {
  if (costRank > 20 || !data?.data_available) {
    return "none";
  }
  const totalCost = data?.avg_growth_total_cost ?? 0;
  const sinhwan = data?.avg_growth_sinhwan ?? 0;
  const revisit = data?.avg_growth_revisit ?? 0;

  if (totalCost <= -20 || sinhwan <= -20 || revisit <= -20) return "bad";
  if (totalCost >= 15 && sinhwan >= 15 && revisit >= 15) return "good";
  return "none";
};
