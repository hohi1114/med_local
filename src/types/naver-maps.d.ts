declare global {
  interface Window {
    naver: any;
  }
}

export type Polygon = {
  area: string;
  polygon: Array<Array<[number, number]>>;
};

export {};
