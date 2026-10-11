/**
 * API 베이스 URL 단일 진입점.
 *
 * 웹(Vercel)과 Electron 데스크톱 앱이 같은 소스를 공유하므로 상대 경로를 쓸 수 없다.
 * Electron은 file:// 로 로드되어 "/api/..." 가 로컬 파일로 해석되기 때문에
 * 반드시 빌드 타임에 절대 URL을 주입해야 한다.
 *
 * 값의 출처:
 *  - 로컬 개발    : .env.development (없으면 아래 fallback)
 *  - 배포 빌드    : .env.production  (Electron 릴리스 워크플로 포함)
 *  - Vercel 빌드  : 프로젝트 환경변수 VITE_API_URL
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
