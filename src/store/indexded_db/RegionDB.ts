import { openDB, IDBPDatabase } from "idb";

// Database constants
const REGION_DB_NAME = "RegionDB";
const REGION_DB_VERSION = 1;
const TABLE = [
  "small_regions",
  "dong_regions",
  "gu_regions",
  "small_region_etc",
  "dong_region_etc",
  "gu_region_etc"
];

export const getDataFromRegionDB = async (regionType: string) => {
  const db = await openDB(REGION_DB_NAME, REGION_DB_VERSION);
  const store = db.transaction(regionType).objectStore(regionType);

  return await store.getAll();
};

// ✅ 데이터베이스 생성 및 열기 함수 (db 반환)
const createDatabase = async (): Promise<IDBPDatabase<unknown>> => {
  try {
    const db = await openDB(REGION_DB_NAME, REGION_DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Upgrade triggered: ${oldVersion} -> ${newVersion}`);

        TABLE.forEach((store) => {
          if (!db.objectStoreNames.contains(store)) {
            console.log(`Creating ${store} store...`);
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
          }
        });
      }
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
    console.log(`Data successfully saved to ${storeName}`);
  } catch (error) {
    console.error(`Error saving data to ${storeName}:`, error);
  }
};

// ✅ IndexedDB에 데이터 저장하는 함수 (최종 호출)
export const saveDataToIndexDB = async (allregioniData: any) => {
  try {
    const db = await createDatabase(); // 데이터베이스 생성

    //모든 object 지우기
    if (!db.objectStoreNames.length) return; // 저장소가 없으면 실행하지 않음

    const tx = db.transaction(Array.from(db.objectStoreNames), "readwrite");
    const promises = Array.from(db.objectStoreNames).map((storeName) =>
      tx.objectStore(storeName).clear()
    );

    await Promise.all(promises); // 모든 clear()가 끝날 때까지 기다림
    await tx.done;

    TABLE.forEach(async (regionType) => {
      await saveDataToStore(db, regionType, allregioniData[regionType]);
    });
    // 데이터 저장
  } catch (error) {
    console.error("Error saving data to regionDB:", error);
  }
};
