# 주별 유입 추이 차트 생성 가이드

## 개요

주별 병원 유입 및 매출 데이터를 시각화하는 Python 스크립트입니다.

## 설치

```bash
pip install matplotlib pandas
```

## 사용 방법

### 1. CLI로 사용

```bash
# JSON 파일에서 차트 생성
python generate_weekly_trend_chart.py --input sample_weekly_data.json --output chart.png

# CSV 파일에서 차트 생성
python generate_weekly_trend_chart.py --input data.csv --output my_chart.png
```

### 2. Python 코드에서 직접 사용

```python
from generate_weekly_trend_chart import generate_chart_from_data

# 데이터 준비
data = [
    {
        "week": "W1",
        "revenue": 15900000,
        "new_patients": 70,
        "first_visit": 7.6,
        "revisit": 63.9,
        "total_visits": 141.7
    },
    {
        "week": "W2",
        "revenue": 16500000,
        "new_patients": 75,
        "first_visit": 8.2,
        "revisit": 67.1,
        "total_visits": 148.3
    },
    # ... 더 많은 주 데이터
]

# 차트 생성
output_file = generate_chart_from_data(data, 'weekly_trend.png')
print(f"차트 생성 완료: {output_file}")
```

### 3. Supabase 데이터에서 직접 생성

```python
import json
from supabase import create_client
from generate_weekly_trend_chart import generate_chart_from_data

# Supabase 클라이언트 초기화
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 주별 통계 조회
response = supabase.table('weekly_statistics') \
    .select('week_start, total_revenue, new_patients, first_visit_patients, return_patients, total_patients') \
    .eq('hospital_name', '화명마디튼튼정형외과') \
    .order('week_start', desc=False) \
    .execute()

# 데이터 변환
weekly_data = []
for idx, row in enumerate(response.data, 1):
    # 주차 포맷 생성 (예: "W1", "W2", ...)
    date = row['week_start']
    month = int(date.split('-')[1])
    day = int(date.split('-')[2])
    week_of_month = (day - 1) // 7 + 1
    week_label = f"{month}.W{week_of_month}"

    weekly_data.append({
        "week": week_label,
        "revenue": row['total_revenue'],
        "new_patients": row['new_patients'],
        "first_visit": row['first_visit_patients'],
        "revisit": row['return_patients'],
        "total_visits": row['total_patients']
    })

# 차트 생성
generate_chart_from_data(weekly_data, 'hospital_trend.png')
```

## 데이터 형식

### 필수 필드

- `week`: 주차 레이블 (예: "W1", "12.W4")
- `revenue`: 매출액 (정수, KRW)
- `new_patients`: 신환 수 (정수 또는 실수)

### 선택 필드

- `first_visit`: 초진 환자 수
- `revisit`: 재진 환자 수
- `total_visits`: 전체 방문 수

## 차트 특징

1. **이중 Y축**
   - 왼쪽: 매출 (막대그래프, 연한 주황색)
   - 오른쪽: 신환 수 (선 그래프, 파란색)

2. **스타일**
   - 깔끔한 보고서용 디자인
   - 한글 제목: "주별 유입 추이"
   - 영문 부제: "Weekly Inflow & Revenue Trend"
   - Y축 기준 점선 그리드

3. **출력**
   - 해상도: 150 DPI
   - 크기: 12x6 인치
   - 포맷: PNG (투명 배경 아님, 흰색 배경)

## 테스트

샘플 데이터로 테스트:

```bash
python generate_weekly_trend_chart.py --input sample_weekly_data.json --output test_chart.png
```

생성된 `test_chart.png` 파일을 확인하여 차트가 올바르게 생성되었는지 확인합니다.

## HTML 보고서에 삽입

생성된 차트 이미지를 HTML 보고서에 삽입하려면:

```html
<img src="weekly_trend.png" alt="주별 유입 추이" style="width: 100%; max-width: 800px; margin: 16px 0;">
```

또는 Base64로 인코딩하여 직접 삽입:

```python
import base64

# 이미지를 Base64로 인코딩
with open('weekly_trend.png', 'rb') as f:
    img_data = base64.b64encode(f.read()).decode('utf-8')

# HTML에 삽입
html = f'<img src="data:image/png;base64,{img_data}" alt="주별 유입 추이" style="width: 100%; max-width: 800px;">'
```

## 문제 해결

### 한글 폰트가 깨지는 경우

**macOS:**
```python
plt.rcParams['font.family'] = 'AppleGothic'
```

**Windows:**
```python
plt.rcParams['font.family'] = 'Malgun Gothic'
```

**Linux:**
```python
plt.rcParams['font.family'] = 'NanumGothic'
```

또는 시스템에 설치된 한글 폰트 확인:

```python
import matplotlib.font_manager as fm
fonts = [f.name for f in fm.fontManager.ttflist if 'Gothic' in f.name or 'Nanum' in f.name]
print(fonts)
```
