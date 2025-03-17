import { faker } from "@faker-js/faker";
import dayjs from "dayjs";

const SEOUL_GYEONGGI_BOUNDS = {
  latMin: 37.45,
  latMax: 37.7,
  lonMin: 126.8,
  lonMax: 127.15
};

export const dashboardMock = () => {
  const mockData = [];
  for (let i = 0; i < 2000; i++) {
    let temp = {
      age: `${faker.number.int({ min: 1, max: 90 })}세 ${faker.number.int({
        min: 0,
        max: 12
      })}개월`,
      longtitude: faker.number.float({
        min: SEOUL_GYEONGGI_BOUNDS.lonMin,
        max: SEOUL_GYEONGGI_BOUNDS.lonMax,
        precision: 6
      }),
      latitude: faker.number.float({
        min: SEOUL_GYEONGGI_BOUNDS.latMin,
        max: SEOUL_GYEONGGI_BOUNDS.latMax,
        precision: 6
      }),
      chartNumber: faker.number.int({ min: 0, max: 10000 }),
      id: faker.number.int({ min: 100, max: 999 }),
      totalCost: faker.number.int({ min: 10000, max: 5000000 }),
      visitDate: dayjs(
        faker.date.between({ from: "2025-01-01", to: Date.now() })
      ).format("YYYY-MM-DD"),
      visitType: faker.helpers.arrayElement(["신환", "재진", "초진"])
    };
    mockData.push(temp);
  }
  return mockData;
};
