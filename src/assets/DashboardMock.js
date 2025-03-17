import { faker } from "@faker-js/faker";
import dayjs from "dayjs";

const SEOUL_GYEONGGI_BOUNDS = {
  latMin: 37.45,
  latMax: 37.7,
  lonMin: 126.8,
  lonMax: 127.15
};

const SINJEONGDONG_BOUNDS = {
  latMin: 37.4996,
  latMax: 37.51258,
  lonMin: 126.85907,
  lonMax: 126.872
};

export const dashboardMock = () => {
  return new Promise((resolve, reject) => {
    try {
      const mockData = [];
      for (let i = 0; i < 1000; i++) {
        const isSinjeong = Math.random() < 0.7;
        const bounds = isSinjeong ? SINJEONGDONG_BOUNDS : SEOUL_GYEONGGI_BOUNDS;

        let temp = {
          age: `${faker.number.int({ min: 1, max: 90 })}세 ${faker.number.int({
            min: 0,
            max: 12
          })}개월`,
          longitude: faker.number.float({
            min: bounds.lonMin,
            max: bounds.lonMax,
            precision: 6
          }),
          latitude: faker.number.float({
            min: bounds.latMin,
            max: bounds.latMax,
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

      // Resolve the Promise with the generated data
      resolve(mockData);
    } catch (error) {
      // Reject the Promise if there's an error
      reject(error);
    }
  });
};
