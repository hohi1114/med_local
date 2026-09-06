# Supabase Database Schema (새 DB)

## 개요
- 병원 1개 = 네이버 플레이스 1개 + 네이버 블로그 1개 (메인)
- secondary_accounts = 2차, 3차 블로그 계정들
- 인사이트 통계: **주 단위** 조회 (referer_stats, visit_stats, smartplace_stats)
- 순위 이력: **일 단위** 조회 (place_rank_history, blog_posts.rank_history)

---

## 테이블 구조

### 1. hospitals
병원 정보 + 메인 블로그/플레이스 통계

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| created_at | timestamptz | 생성일시 |
| place_id | text | 네이버 플레이스 ID |
| name | text | 병원명 |
| category | text | 카테고리 |
| keywords | text[] | 네이버 지도 검색 키워드 (순위 추적용) |
| address | text | 주소 |
| smartplace_id | text | 스마트플레이스 로그인 ID |
| smartplace_password | text | 스마트플레이스 비밀번호 |
| referer_stats | jsonb | **블로그** 유입 경로 인사이트 (주간) |
| visit_stats | jsonb | **블로그** 조회수 인사이트 (주간) |
| smartplace_stats | jsonb | **플레이스** 통계 (주간) |
| place_rank_history | jsonb | keywords로 검색 시 플레이스 순위 (일간) |

#### referer_stats 구조 (블로그 인사이트 - 주간)
```typescript
Array<{
  weekStart: string;      // "2025-01-06" (주 시작일)
  weekEnd: string;        // "2025-01-12" (주 종료일)
  referers: Array<{
    source: string;       // "네이버검색", "블로그", "외부유입", "기타" 등
    percentage: number;   // 38.5
  }>;
}>
```

#### visit_stats 구조 (블로그 조회수 - 주간)
```typescript
Array<{
  weekStart: string;      // "2025-01-06"
  weekEnd: string;        // "2025-01-12"
  visitTotal: number;     // 1234 (주간 총 조회수)
}>
```

#### smartplace_stats 구조 (플레이스 통계 - 주간)
```typescript
Array<{
  weekStart: string;      // "2025-01-06"
  weekEnd: string;        // "2025-01-12"
  channels: Array<{
    channel: string;      // "플레이스홈검색", "예약하기", "전화하기" 등
    count: number;        // 채널별 카운트
  }>;
  keywords: Array<{
    keyword: string;      // "강남정형외과", "허리디스크" 등
    count: number;        // 키워드별 유입 카운트
  }>;
  visitCount: number;     // 총 방문 카운트
}>
```

#### place_rank_history 구조 (플레이스 순위 - 일간)
```typescript
// hospitals.keywords의 키워드로 네이버 지도 검색 시 순위
Array<{
  rank: number;           // 순위 (예: 5)
  checked_at: string;     // "2025-01-15T10:30:00Z"
}>
```

---

### 2. blog_posts
특정 블로그의 개별 포스팅들

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| created_at | timestamptz | 생성일시 |
| hospital_id | uuid | FK → hospitals.id (어느 병원 블로그의 글인지) |
| url | text | 포스팅 URL |
| title | text | 포스팅 제목 |
| keywords | text[] | 추출된 주요 키워드 (순위 추적용) |
| keywords_status | text | 키워드 추출 상태: `'completed'` |
| rank_history | jsonb | keywords로 검색 시 이 글의 순위 (일간) |
| view_history | jsonb | 이 글의 조회수 이력 |

#### rank_history 구조 (포스팅 순위 - 일간)
```typescript
// blog_posts.keywords로 네이버 검색 시 이 포스팅의 순위
Array<{
  rank: number | "out";   // 순위 (숫자) 또는 "out" (순위권 밖)
  checked_at: string;     // "2025-01-15T10:30:00Z"
}>
```

#### view_history 구조 (포스팅 조회수)
```typescript
Array<{
  views: number;          // 조회수
  checked_at: string;     // 체크 시점
}>
```

---

### 3. keyword_suggestion_tasks
키워드 제안 작업 (LLM 기반)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| created_at | timestamptz | 생성일시 |
| hospital_id | uuid | FK → hospitals.id |
| input | jsonb | 입력 데이터 (아래 참조) |
| result | jsonb | 결과 데이터 (아래 참조) |
| status | text | 상태: `'completed'` |

#### input 구조
```typescript
{
  hospitalId: string;
  services: string[];       // ["관절치료", "척추치료", "재활치료"]
  locations: string[];      // ["강남", "서초", "송파"]
  coreKeywords: string[];   // ["정형외과", "관절전문"]
}
```

#### result 구조
```typescript
{
  local_keywords: Array<{
    keyword: string;              // "강남정형외과"
    monthly_search_volume: number; // 12000
    sub_keywords: Array<{
      keyword: string;            // "강남정형외과추천"
      monthly_search_volume: number;
    }>;
  }>;
  national_keywords: Array<{
    keyword: string;              // "허리디스크치료"
    monthly_search_volume: number;
    sub_keywords: Array<{
      keyword: string;
      monthly_search_volume: number;
    }>;
  }>;
}
```

---

### 4. place_reviews
네이버 플레이스 리뷰

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| created_at | timestamptz | 생성일시 |
| hospital_id | uuid | FK → hospitals.id |
| author | text | 작성자 (마스킹됨) |
| content | text | 리뷰 내용 |
| rating | int4 | 별점 (1-5) |
| visit_date | text | 방문일 |
| status | text | 상태: `'pending'` \| `'not_malicious'` |

---

### 5. secondary_accounts
병원의 2차, 3차 블로그 계정들 (부계정)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| created_at | timestamptz | 생성일시 |
| hospital_id | uuid | FK → hospitals.id |
| place_id | text | 네이버 플레이스 ID (해당되는 경우) |
| name | text | 블로그 계정명 |
| smartplace_id | text | 스마트플레이스 ID |
| smartplace_password | text | 스마트플레이스 비밀번호 |
| referer_stats | jsonb | 블로그 유입 경로 인사이트 (주간) - hospitals와 동일 구조 |
| visit_stats | jsonb | 블로그 조회수 인사이트 (주간) - hospitals와 동일 구조 |

---

## 관계도

```
hospitals (병원 + 메인 블로그/플레이스)
    │
    ├── (N) blog_posts           # 메인 블로그의 포스팅들
    ├── (N) secondary_accounts   # 2차, 3차 블로그 계정들
    ├── (N) keyword_suggestion_tasks  # 키워드 제안 작업
    └── (N) place_reviews        # 플레이스 리뷰들
```

---

## 데이터 흐름 요약

### 블로그 관련
- `hospitals.referer_stats` / `visit_stats` → 메인 블로그 인사이트 (주간)
- `secondary_accounts.referer_stats` / `visit_stats` → 부계정 블로그 인사이트 (주간)
- `blog_posts` → 개별 포스팅의 순위/조회수 추적 (일간)

### 플레이스 관련
- `hospitals.smartplace_stats` → 플레이스 통계 (주간)
- `hospitals.place_rank_history` → 키워드 검색 시 플레이스 순위 (일간)
- `place_reviews` → 플레이스 리뷰

---

## 참고사항

- 모든 테이블은 `id` (uuid)를 PK로 사용
- 외래키는 `hospital_id`로 hospitals 테이블 참조
- **주간 통계**: referer_stats, visit_stats, smartplace_stats
- **일간 순위**: place_rank_history, blog_posts.rank_history
- `checked_at`, `weekStart`, `weekEnd` 등 날짜 필드는 ISO 8601 형식
