import { authApi } from './api/apihelper';

export interface MarketingCalendarEntry {
  id: string;
  date: string;              // 날짜 (YYYY-MM-DD)
  type: string;              // Type (콘텐츠/업무 타입)
  status: string;            // 진행 현황
  title: string;             // 제목
  assignee: string;          // 담당자
  url: string;               // URL
}

export interface NotionCalendarData {
  periodA: MarketingCalendarEntry[];
  periodB: MarketingCalendarEntry[];
}

export interface NotionConnectionStatus {
  connected: boolean;
  databaseTitle?: string;
  message?: string;
}

export interface NotionDatabaseProperty {
  name: string;
  type: string;
}

// 저장된 Notion Database 레코드
export interface NotionDatabaseRecord {
  id: string;
  user_id: string;
  database_id: string;
  database_name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 마케팅 캘린더 데이터 조회
 */
export async function getMarketingCalendar(
  databaseId: string,
  periodAStart: string,
  periodAEnd: string,
  periodBStart: string,
  periodBEnd: string
): Promise<NotionCalendarData> {
  try {
    const response = await authApi.post('/notion/calendar', {
      databaseId,
      periodAStart,
      periodAEnd,
      periodBStart,
      periodBEnd,
    });
    return response.data;
  } catch (error) {
    console.error('Notion 캘린더 데이터 조회 오류:', error);
    throw new Error('마케팅 캘린더 데이터를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * Notion 연결 상태 확인
 */
export async function checkNotionConnection(databaseId: string): Promise<NotionConnectionStatus> {
  try {
    const response = await authApi.get(`/notion/connection/${encodeURIComponent(databaseId)}`);
    return response.data;
  } catch (error) {
    console.error('Notion 연결 확인 오류:', error);
    return { connected: false, message: '연결 확인 중 오류가 발생했습니다.' };
  }
}

/**
 * Notion Database 속성 목록 조회
 */
export async function getDatabaseProperties(databaseId: string): Promise<NotionDatabaseProperty[]> {
  try {
    const response = await authApi.get(`/notion/properties/${encodeURIComponent(databaseId)}`);
    return response.data.properties || [];
  } catch (error) {
    console.error('Notion DB 속성 조회 오류:', error);
    throw new Error('Database 속성을 불러오는 중 오류가 발생했습니다.');
  }
}

// =====================================================
// Notion Database ID 관리 API
// =====================================================

/**
 * 사용자의 저장된 Notion Database 목록 조회
 */
export async function getNotionDatabases(userId: string): Promise<NotionDatabaseRecord[]> {
  try {
    const response = await authApi.get(`/notion/databases/${encodeURIComponent(userId)}`);
    return response.data.databases || [];
  } catch (error) {
    console.error('Notion DB 목록 조회 오류:', error);
    throw new Error('Database 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 새 Notion Database 추가
 */
export async function addNotionDatabase(
  userId: string,
  databaseId: string,
  databaseName?: string,
  description?: string
): Promise<NotionDatabaseRecord> {
  try {
    const response = await authApi.post('/notion/databases', {
      userId,
      databaseId,
      databaseName,
      description,
    });
    return response.data.database;
  } catch (error: any) {
    console.error('Notion DB 추가 오류:', error);
    if (error.response?.status === 409) {
      throw new Error('이미 등록된 Database ID입니다.');
    }
    throw new Error('Database 추가 중 오류가 발생했습니다.');
  }
}

/**
 * Notion Database 정보 수정
 */
export async function updateNotionDatabase(
  id: string,
  databaseName: string,
  description?: string
): Promise<NotionDatabaseRecord> {
  try {
    const response = await authApi.put(`/notion/databases/${encodeURIComponent(id)}`, {
      databaseName,
      description,
    });
    return response.data.database;
  } catch (error) {
    console.error('Notion DB 수정 오류:', error);
    throw new Error('Database 수정 중 오류가 발생했습니다.');
  }
}

/**
 * Notion Database 삭제
 */
export async function deleteNotionDatabase(id: string): Promise<void> {
  try {
    await authApi.delete(`/notion/databases/${encodeURIComponent(id)}`);
  } catch (error) {
    console.error('Notion DB 삭제 오류:', error);
    throw new Error('Database 삭제 중 오류가 발생했습니다.');
  }
}

/**
 * 여러 Notion Database 일괄 추가
 */
export async function bulkAddNotionDatabases(
  userId: string,
  databaseIds: string[]
): Promise<{ success: NotionDatabaseRecord[]; failed: { databaseId: string; error: string }[] }> {
  try {
    const response = await authApi.post('/notion/databases/bulk', {
      userId,
      databaseIds,
    });
    return response.data;
  } catch (error) {
    console.error('Notion DB 일괄 추가 오류:', error);
    throw new Error('Database 일괄 추가 중 오류가 발생했습니다.');
  }
}
