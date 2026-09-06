import React from "react";
import styled from "styled-components";

type AgeSummaryGridProps = {
  /** 예: { "0":147, "10":175, ... "80":26 } */
  counts: Record<string, number>;
  /** 예: { "0":48.48, "10":-1.13, ... "80":23.81 } (없으면 null) */
  diffs: Record<string, number | null>;
  title?: string;
};

/** 화면에 보여줄 순서(80을 없애고 70+로 대체) */
const DISPLAY_BUCKETS = ["0", "10", "20", "30", "40", "50", "60", "70+"];

/** 라벨 매핑 */
const labelOf = (k: string) =>
  k === "0" ? "유아" : k === "70+" ? "70대 이상" : `${k}대`;

/** 70, 80을 합쳐 70+로 만든다 */
function merge70Plus(
  counts: Record<string, number>,
  diffs: Record<string, number | null>
) {
  const c70 = counts?.["70"] ?? 0;
  const c80 = counts?.["80"] ?? 0;
  const d70 = diffs?.["70"] ?? null;
  const d80 = diffs?.["80"] ?? null;

  // 가중 평균(단, null은 제외). 두 값 모두 null이면 null 유지
  const total = c70 + c80;
  let mergedDiff: number | null = null;
  const w70 = d70 != null ? c70 : 0;
  const w80 = d80 != null ? c80 : 0;
  const wSum = (d70 != null ? c70 : 0) + (d80 != null ? c80 : 0);

  if (wSum > 0) {
    const num =
      (d70 != null ? d70 * w70 : 0) +
      (d80 != null ? d80 * w80 : 0);
    mergedDiff = num / wSum;
  } else if (d70 != null) {
    mergedDiff = d70;
  } else if (d80 != null) {
    mergedDiff = d80;
  } else {
    mergedDiff = null;
  }

  return { count: total, diff: mergedDiff };
}

const AgeSummaryGrid: React.FC<AgeSummaryGridProps> = ({
  counts,
  diffs,
  title = "신환 수 / 증감률",
}) => {
  const seventyPlus = merge70Plus(counts, diffs);

  const rows = DISPLAY_BUCKETS.map((k) => {
    if (k === "70+") {
      return { key: k, label: labelOf(k), count: seventyPlus.count, diff: seventyPlus.diff };
    }
    return { key: k, label: labelOf(k), count: counts?.[k] ?? 0, diff: diffs?.[k] ?? null };
  });

  return (
    <Wrapper>
      <Header>{title}</Header>

      <Grid>
        {rows.map(({ key, label, count, diff }) => {
          const isNull = diff === null;
          const isUp = !isNull && (diff ?? 0) >= 0;
          const arrowSrc = isUp ? "/images/arrow_up.svg" : "/images/arrow_down.svg";
          const chipColor = isNull ? "#6b7280" : isUp ? "#16a34a" : "#ef4444";
          const diffText = isNull
            ? "∞ %"
            : `${(diff ?? 0) > 0 ? "+" : ""}${Number(diff ?? 0).toFixed(2)} %`;

          return (
            <Item key={key}>
              {/* 제목: 좌측 정렬 */}
              <AgeBadge>{label}</AgeBadge>

              {/* 숫자와 퍼센트를 같은 줄, 카드 중앙에 배치 */}
              <MainRow>
                <Count>{count.toLocaleString()}</Count>
                <Unit>명</Unit>
                <ChangeChip $color={chipColor}>
                  {!isNull && <Arrow src={arrowSrc} alt={isUp ? "increase" : "decrease"} />}
                  <ChipText>{diffText}</ChipText>
                </ChangeChip>
              </MainRow>
            </Item>
          );
        })}
      </Grid>
    </Wrapper>
  );
};

export default AgeSummaryGrid;

/* ───────── styles ───────── */

const Wrapper = styled.div`
  width: 100%;
  margin-top: 16px;
`;

const Header = styled.div`
  width: 100%;
  text-align: left;         /* 페이지 섹션 제목은 좌측 정렬 */
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 12px;
  color: ${(p) => p.theme.colors.black01};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4×4 그리드 */
  gap: 16px;
  width: 100%;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 820px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Item = styled.div`
  background: #fff;
  border: 1px solid ${(p) => p.theme.colors.gray01};
  border-radius: 12px;
  padding: 12px 16px; /* 상하 패딩 줄이기 */
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* 위쪽부터 채우기 */
  gap: 4px; /* 항목 간 간격 줄이기 */
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;


const AgeBadge = styled.div`
  font-size: 1.2em;
  font-weight: 600;
  color: ${(p) => p.theme.colors.gray06};
  text-align: left;         /* 카드 내부 제목: 좌측 정렬 */
`;

const MainRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;  /* 숫자+퍼센트 라인: 카드 중앙 */
  gap: 8px;
  margin-top: 4px;
`;

const Count = styled.span`
  font-size: 1.9rem;
  font-weight: 800;
  color: ${(p) => p.theme.colors.black01};
  line-height: 1;
`;

const Unit = styled.span`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${(p) => p.theme.colors.black01};
  line-height: 1;
`;

const ChangeChip = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  color: ${(p) => p.$color};
  line-height: 1;
`;

const Arrow = styled.img`
  width: 14px;
  height: 14px;
`;

const ChipText = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
`;
