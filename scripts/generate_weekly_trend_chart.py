"""
주별 유입 추이 시각화 스크립트

[목적]
연속된 주차 데이터를 기반으로 병원의 주별 유입 및 매출 흐름을
한 눈에 파악하기 위한 트렌드 그래프 생성

[데이터 구조]
입력 데이터는 주 단위로 정렬된 리스트 또는 DataFrame 형태
필수 컬럼:
- week: 문자열 (예: "W1", "W2", "W3", ...)
- revenue: 정수 (KRW)
- new_patients: 정수 또는 실수
- first_visit: 정수 또는 실수 (초진)
- revisit: 정수 또는 실수 (재진)
- total_visits: 정수 또는 실수 (전체 방문 수)

[사용 예시]
python generate_weekly_trend_chart.py --input data.json --output weekly_trend.png
"""

import json
import argparse
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from pathlib import Path
import pandas as pd

# 한글 폰트 설정 (macOS의 경우)
plt.rcParams['font.family'] = 'AppleGothic'
plt.rcParams['axes.unicode_minus'] = False  # 마이너스 기호 깨짐 방지


def load_data(input_path: str):
    """
    JSON 또는 CSV 파일에서 데이터 로드

    Args:
        input_path: 입력 파일 경로 (.json 또는 .csv)

    Returns:
        pandas.DataFrame
    """
    path = Path(input_path)

    if path.suffix == '.json':
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        df = pd.DataFrame(data)
    elif path.suffix == '.csv':
        df = pd.read_csv(path)
    else:
        raise ValueError(f"지원하지 않는 파일 형식: {path.suffix}")

    # 필수 컬럼 확인
    required_cols = ['week', 'revenue', 'new_patients']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"필수 컬럼 누락: {missing_cols}")

    return df


def create_weekly_trend_chart(df: pd.DataFrame, output_path: str = 'weekly_trend.png'):
    """
    주별 유입 추이 그래프 생성

    Args:
        df: 주별 데이터 DataFrame (week, revenue, new_patients 컬럼 필수)
        output_path: 출력 이미지 파일 경로
    """
    # Figure 및 Axes 생성
    fig, ax1 = plt.subplots(figsize=(12, 6))

    # 왼쪽 Y축: Revenue (막대그래프)
    x = range(len(df))
    ax1.bar(
        x,
        df['revenue'],
        color='#FAD7A0',  # 연한 주황색
        alpha=0.8,
        label='Revenue',
        zorder=2
    )
    ax1.set_xlabel('주차 (Week)', fontsize=11, fontweight='500')
    ax1.set_ylabel('Revenue (KRW)', fontsize=11, fontweight='500', color='#E67E22')
    ax1.tick_params(axis='y', labelcolor='#E67E22')
    ax1.set_xticks(x)
    ax1.set_xticklabels(df['week'], rotation=0, ha='center')

    # Y축 포맷팅 (천 단위 콤마)
    ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x):,}'))

    # 오른쪽 Y축: New Patients (선 그래프)
    ax2 = ax1.twinx()
    ax2.plot(
        x,
        df['new_patients'],
        color='#3498DB',  # 파란색
        marker='o',
        markersize=6,
        linewidth=2,
        label='New Patients',
        zorder=3
    )
    ax2.set_ylabel('New Patients', fontsize=11, fontweight='500', color='#3498DB')
    ax2.tick_params(axis='y', labelcolor='#3498DB')

    # 그리드 설정 (Y축 기준 점선만)
    ax1.grid(axis='y', linestyle='--', alpha=0.3, zorder=1)

    # 제목 설정
    plt.title('주별 유입 추이\nWeekly Inflow & Revenue Trend',
              fontsize=14,
              fontweight='600',
              pad=20)

    # 범례 설정
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2,
               loc='upper left',
               framealpha=0.9,
               fontsize=10)

    # 레이아웃 조정
    plt.tight_layout()

    # 저장
    plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"✅ 차트 저장 완료: {output_path}")

    # 화면에 표시 (선택사항)
    # plt.show()

    plt.close()


def main():
    """
    CLI 실행 함수
    """
    parser = argparse.ArgumentParser(
        description='주별 유입 추이 그래프 생성',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
  python generate_weekly_trend_chart.py --input data.json --output chart.png
  python generate_weekly_trend_chart.py --input data.csv
        """
    )

    parser.add_argument(
        '--input', '-i',
        type=str,
        required=True,
        help='입력 데이터 파일 경로 (.json 또는 .csv)'
    )

    parser.add_argument(
        '--output', '-o',
        type=str,
        default='weekly_trend.png',
        help='출력 이미지 파일 경로 (기본값: weekly_trend.png)'
    )

    args = parser.parse_args()

    # 데이터 로드
    print(f"📂 데이터 로딩: {args.input}")
    df = load_data(args.input)
    print(f"   - {len(df)}개 주차 데이터 로드됨")

    # 차트 생성
    print(f"📊 차트 생성 중...")
    create_weekly_trend_chart(df, args.output)


# =============================================================================
# 프로그래밍 방식 사용 예시
# =============================================================================

def generate_chart_from_data(data_list: list, output_path: str = 'weekly_trend.png'):
    """
    Python 코드에서 직접 호출하는 함수

    Args:
        data_list: 주별 데이터 리스트
            [
                {
                    "week": "W1",
                    "revenue": 15900000,
                    "new_patients": 70,
                    "first_visit": 7.6,
                    "revisit": 63.9,
                    "total_visits": 141.7
                },
                ...
            ]
        output_path: 출력 이미지 파일 경로

    Returns:
        str: 생성된 이미지 파일 경로

    Example:
        >>> data = [
        ...     {"week": "W1", "revenue": 15900000, "new_patients": 70},
        ...     {"week": "W2", "revenue": 16500000, "new_patients": 75},
        ...     {"week": "W3", "revenue": 14800000, "new_patients": 68},
        ... ]
        >>> generate_chart_from_data(data, 'my_chart.png')
        'my_chart.png'
    """
    df = pd.DataFrame(data_list)
    create_weekly_trend_chart(df, output_path)
    return output_path


if __name__ == '__main__':
    main()
