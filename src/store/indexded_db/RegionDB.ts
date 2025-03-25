import { openDB, IDBPDatabase } from "idb";

// Database constants
const REGION_DB_NAME = "RegionDB";
const TABLE = ["small_regions", "dong_regions", "gu_regions"];

export const getDataFromRegionDB = async (regionType: string) => {
  const db = await openDB(REGION_DB_NAME);
  const store = db.transaction(regionType).objectStore(regionType);
  return await store.getAll();
};

// ✅ 데이터베이스 생성 및 열기 함수 (db 반환)
const createDatabase = async (
  version: number
): Promise<IDBPDatabase<unknown>> => {
  try {
    const db = await openDB(REGION_DB_NAME, version, {
      upgrade(db, oldVersion, newVersion) {
        // 메타데이터 저장소 생성
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata", { keyPath: "id" });
        }

        // 지역 저장소 생성
        TABLE.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
          }
        });
      },
    });

    return db;
  } catch (error) {
    console.error("Error creating database:", error);
    throw error;
  }
};

// ✅ 데이터 저장 함수 (트랜잭션 완료 보장)
const saveDataToStore = async (
  db: IDBPDatabase<unknown>,
  storeName: string,
  data: any[]
) => {
  try {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);

    // 비동기 데이터 저장 (병렬 처리)
    await Promise.all(data.map((item) => store.put(item)));

    await tx.done; // 트랜잭션 완료 보장
  } catch (error) {
    console.error(`Error saving data to ${storeName}:`, error);
  }
};

// ✅ 현재 데이터베이스 버전 가져오기
const getCurrentDatabaseVersion = async (): Promise<number | null> => {
  try {
    const db = await openDB(REGION_DB_NAME);
    const version = db.version;
    db.close();
    return version;
  } catch (error) {
    // 데이터베이스가 없는 경우 null 반환
    return null;
  }
};

// ✅ IndexedDB에 데이터 저장하는 함수 (최종 호출)
export const saveDataToIndexDB = async (
  allregioniData: any,
  newVersion: number
) => {
  try {
    // 현재 DB 버전 확인
    const currentVersion = await getCurrentDatabaseVersion();

    // 현재 버전과 새 버전이 같으면 업데이트 불필요
    if (currentVersion === newVersion) {
      return;
    }

    // 새 버전으로 데이터베이스 생성/업그레이드
    const db = await createDatabase(newVersion);

    // 기존 데이터 초기화 (메타데이터 제외)
    const storeNames = TABLE.filter((name) =>
      db.objectStoreNames.contains(name)
    );
    if (storeNames.length > 0) {
      const tx = db.transaction(storeNames, "readwrite");
      await Promise.all(
        storeNames.map((store) => tx.objectStore(store).clear())
      );
      await tx.done;
    }

    // 새 데이터 저장
    await Promise.all(
      TABLE.map((regionType) =>
        saveDataToStore(db, regionType, allregioniData[regionType])
      )
    );

    // 메타데이터 저장 (버전 정보)
    if (db.objectStoreNames.contains("metadata")) {
      const tx = db.transaction("metadata", "readwrite");
      await tx.objectStore("metadata").put({
        id: "version",
        value: newVersion,
        updatedAt: new Date().toISOString(),
      });
      await tx.done;
    }

    db.close();
  } catch (error) {
    console.error("Error saving data to regionDB:", error);
    throw error;
  }
};
