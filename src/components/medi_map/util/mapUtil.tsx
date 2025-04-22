import { getDataFromRegionDB } from "../../../store/indexded_db/RegionDB";
import { AverageGrowth } from "../../../types/dashboard";
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
  high_high_high: "매출, 신환, 재진율 모두 긍정적인 추이를 보이고 있어요.",
  high_mid_mid: "매출, 신환 유입에서 긍정적인 추이를 보이고 있어요.",
  high_low_low:
    "매출 추이는 좋으나 신환 유입, 재진율 상승에 신경 써보시는 건 어떨까요?",
  high_low_mid:
    "매출 추이는 좋으나 신환 유입, 재진율 상승에 신경 써보시는 건 어떨까요?",
  high_mid_low: "재진율 상승에 조금 신경 써보시는 것을 추천드릴게요.",
  high_low_high:
    "매출 추이는 좋으나, 신환이 감소하는 추세에요. 신규 환자 유입에 신경써보시는 건 어떨까요?",
  high_high_low: "재진율 상승에 조금 신경 써보시는 것을 추천드릴게요.",
  high_high_mid: "좋은 매출 추이입니다~",
  high_mid_high: "매출과 재진율에서 긍정적인 추이를 보이고 있어요.",

  mid_high_high: "신환, 재진율 모두 긍정적인 추이를 보이고 있어요.",
  mid_high_mid: "신환 유입이 좋은 편이에요. 재진율도 함께 살펴보면 좋겠어요.",
  mid_high_low: "신환 유입은 괜찮지만, 재진율은 조금 아쉬운 편이에요.",
  mid_mid_high: "재방문 환자 증가가 돋보여요. 유지율이 좋습니다.",
  mid_mid_mid: "전체적으로 안정적인 추이를 보이고 있어요.",
  mid_mid_low: "재진율이 다소 낮아졌어요. 관리가 필요할 수 있어요.",
  mid_low_high: "신환 유입은 아쉽지만, 재방문 환자 비율은 양호해요.",
  mid_low_mid: "신환 유입이 다소 아쉬운 편이에요.",
  mid_low_low: "신환과 재진율 모두 하락 추세예요. 개선이 필요해 보여요.",

  low_high_high:
    "신환과 재진율은 좋지만, 매출이 줄고 있어요. 객단가를 점검해보세요.",
  low_high_mid: "신환 유입은 좋은데 매출은 다소 감소했어요.",
  low_high_low: "신환은 늘었지만, 재진율과 매출이 아쉬운 편이에요.",
  low_mid_high: "재방문 환자는 증가했지만 매출이 감소했어요.",
  low_mid_mid: "매출과 환자 유입 모두 정체된 모습이에요.",
  low_mid_low: "매출과 재진율 모두 감소세입니다. 점검이 필요해요.",
  low_low_high: "신환 유입은 감소했지만 재진율은 안정적이에요.",
  low_low_mid: "매출과 신환 유입이 모두 감소했어요.",
  low_low_low: "세 지표 모두 하락세입니다. 전반적인 진단이 필요해요."
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
  if (age <= 40) return "20-40";
  if (age <= 60) return "40-60";
  return "60+";
};

const getSummaryMessage = (age: number, percent: number): string => {
  if (percent >= 10) return `${age}대 환자군이 많이 증가했네요! 좋은 추세에요.`;
  if (percent <= -10) return `${age}대 환자군이 감소하는 추세에요.`;
  return `${age}대 환자군은 안정적인 추이를 보이고 있어요.`;
};

const strategyMap: Record<string, { increase: string; decrease: string }> = {
  "0-20": { increase: "", decrease: "" },
  "20-40": {
    increase: "젊은 고객층이 효과적으로 유입되고 있어요.",
    decrease: `젊은 고객층을 타겟할 전략들을 시도해보시는 건 어떨까요?\n1) 병원 내 젊은 층 타겟 이벤트 기획\n2) 인터넷 기반 병원 서칭 강화 (플레이스, 네이버 블로그, 숏폼 등)`
  },
  "40-60": {
    increase: "중장년층 고객들이 효과적으로 유입되고 있어요.",
    decrease: `중장년층 고객들을 타겟할 전략들을 시도해보시는 건 어떨까요?\n1) 아파트 DID 광고\n2) 카카오톡 채널 친구 맺기 등 재방문 유도\n3) 네이버 플레이스 리뷰 강화`
  },
  "60+": {
    increase: "고령층 고객들이 효과적으로 유입되고 있어요.",
    decrease: `고령층 고객들을 타겟할 전략들을 시도해보시는 건 어떨까요?\n1) 오프라인 중심 홍보 (전단지, 지역방송 등)\n2) 자녀 설득형 콘텐츠 제작\n3) 지역 커뮤니티 프로그램 연계`
  }
};

export const getGrowthAgeMessage = (
  age: number,
  change_percent: number
): {
  age: string;
  summaryMessage: string;
  strategyMessage: string;
} => {
  const range = getAgeRange(age);
  const summaryMessage = getSummaryMessage(age, change_percent);

  let strategyMessage = "";
  if (change_percent >= 10) strategyMessage = strategyMap[range].increase;
  else if (change_percent <= -10) strategyMessage = strategyMap[range].decrease;

  return {
    age: `${age}대`,
    summaryMessage,
    strategyMessage
  };
};
