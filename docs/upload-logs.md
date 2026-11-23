# 원내 데이터 업로드 로그 (upload_logs)

업로드 1회마다 단계별 결과를 백엔드 DB(`upload_logs`)에 1행으로 남긴다.
파싱이 실패하면 백엔드에는 빈 배열만 도착해 원인을 알 수 없던 문제를 해결한다.

## 무엇이 기록되나

| 컬럼 | 내용 |
|------|------|
| `created_at`, `user_id` | 언제, 어느 병원 계정 |
| `emr_type` | EMR 종류 (bit, vegas2 …) |
| `status` | `success` 정상 / `warning` 일부 파일 0행 / `empty` 최종 업로드 0행 / `failed` 예외 |
| `failed_stage`, `failed_step`, `error_message` | 예외가 난 단계(read·parse·derive·merge·process·upload)와 메시지 |
| `summary` | 한 줄 원인 요약. 예: `일일 수입(2개 파일) 0행 파싱 — 'a.xlsx': 필수 컬럼 없음 [총진료비, 수납일자]` |
| `steps` (jsonb) | 단계별 행 수·소요 시간·빈 값 개수(`empty_fields`), 파일별 `found_headers` / `missing_required` / `missing_optional` |
| `backend_response` | 백엔드가 돌려준 저장 건수 |

환자 데이터는 기록하지 않는다. 행 수, 빈 값 개수, 파일명, 헤더 컬럼명만 남는다.

## 흐름

```
UpdateDataPage ── startUploadDiagnostics() ──▶ window.electron 호출을 감싸 단계 기록
   └ 정상이 아니면 inspect-upload-files (main) 로 파일 헤더만 다시 읽어 누락 컬럼 확인
   └ POST /api/data/upload-log ──▶ upload_logs
```

- `src/utils/uploadDiagnostics.ts`: 단계 기록, 상태 판정, 전송 (전송 실패는 업로드에 영향 없음)
- `src/local/uploadFileInspector.ts`: 헤더 행 탐색 + 기대 컬럼 대조 (Electron main)
- `src/local/uploadParserSpecs.ts`: 파서별 기대 컬럼표. **파서의 헤더 조건을 바꾸면 여기도 수정**

## 조회

- 관리자 대시보드 → `🧾 업로드 로그` (기본: 문제 있는 업로드만)
- API: `GET /api/data/admin/upload-logs?status=failed,empty,warning&user_id=&from=&to=&limit=`
- SQL:

```sql
select l.created_at, u.name, l.emr_type, l.status, l.summary
from upload_logs l join users u on u.id = l.user_id
where l.status <> 'success'
order by l.created_at desc
limit 50;
```

## 배포 순서

1. 백엔드 DB에 `medLocal_back/supabase/migrations/20261123_create_upload_logs.sql` 적용
2. 백엔드 배포 (`/api/data/upload-log`)
3. Electron 앱 새 버전 배포 — 구버전 앱은 로그를 보내지 않는다
