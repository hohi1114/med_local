export const mockComparisonStatsData = {
  first: {
    1: { data: "312명" },
    2: { data: "13,845,620 ₩" },
    3: { data: "52,345 ₩" },
    4: { data: "69,280 ₩" },
    5: { data: "174명" },
    6: { data: "138명" },
    7: { data: "준비중" },
    8: { data: "0 %" }
  },
  second: {
    1: { data: "257명", diffRate: -17.63 },
    2: { data: "11,206,890 ₩", diffRate: -19.08 },
    3: { data: "48,950 ₩", diffRate: -6.49 },
    4: { data: "65,200 ₩", diffRate: -5.89 },
    5: { data: "159명", diffRate: -8.62 },
    6: { data: "98명", diffRate: -28.99 },
    7: { data: "준비중" },
    8: { data: "0 %", diffRate: -24.11 }
  }
};
export const mockFirstRegionPrivate = {
  total_visit_count: 283,
  total_cost: 12578000,
  chojin_rejin_visit_count: 171,
  sinhwan_visit_count: 112,
  average_cost_per_visit: 44440,
  average_cost_per_patient: 67890,
  cost_by_date: {
    "2024-12-17": 890000,
    "2024-12-18": 1012000,
    "2024-12-19": 970000,
    "2024-12-20": 1100000,
    "2024-12-21": 1240000,
    "2024-12-22": 940000,
    "2024-12-23": 980000,
    "2024-12-24": 870000,
    "2024-12-25": 690000,
    "2024-12-26": 830000,
    "2024-12-27": 920000,
    "2024-12-28": 790000,
    "2024-12-29": 850000,
    "2024-12-30": 710000,
    "2024-12-31": 940000
  },
  average_cost_per_visit_by_date: {
    "2024-12-17": 43000,
    "2024-12-18": 45500,
    "2024-12-19": 47000,
    "2024-12-20": 49000,
    "2024-12-21": 50000,
    "2024-12-22": 46500,
    "2024-12-23": 47000,
    "2024-12-24": 45000,
    "2024-12-25": 42000,
    "2024-12-26": 46000,
    "2024-12-27": 47500,
    "2024-12-28": 48000,
    "2024-12-29": 49000,
    "2024-12-30": 46000,
    "2024-12-31": 49500
  },
  patient_count_by_age_group: {
    "0-9": 18,
    "10-19": 25,
    "20-29": 14,
    "30-39": 24,
    "40-49": 35,
    "50-59": 19,
    "60-69": 12,
    "70-79": 6
  },
  total_patient_count: 186,
  diff_rates: {
    total_visit_count: 10.12,
    total_cost: 12.26,
    chojin_rejin_visit_count: 7.55,
    sinhwan_visit_count: 14.29,
    average_cost_per_visit: -9.18,
    average_cost_per_patient: 4.13,
    total_patient_count: 6.89
  }
};

export const mockSecondRegionPrivate = {
  total_visit_count: 257,
  total_cost: 11206890,
  chojin_rejin_visit_count: 159,
  sinhwan_visit_count: 98,
  average_cost_per_visit: 48950,
  average_cost_per_patient: 65200,
  cost_by_date: {
    "2024-12-17": 1010000,
    "2024-12-18": 980000,
    "2024-12-19": 870000,
    "2024-12-20": 1060000,
    "2024-12-21": 1090000,
    "2024-12-22": 940000,
    "2024-12-23": 890000,
    "2024-12-24": 760000,
    "2024-12-25": 550000,
    "2024-12-26": 920000,
    "2024-12-27": 810000,
    "2024-12-28": 690000,
    "2024-12-29": 730000,
    "2024-12-30": 680000,
    "2024-12-31": 770000
  },
  average_cost_per_visit_by_date: {
    "2024-12-17": 49500,
    "2024-12-18": 51000,
    "2024-12-19": 48000,
    "2024-12-20": 52000,
    "2024-12-21": 53000,
    "2024-12-22": 47000,
    "2024-12-23": 46000,
    "2024-12-24": 44000,
    "2024-12-25": 42000,
    "2024-12-26": 50000,
    "2024-12-27": 49000,
    "2024-12-28": 47000,
    "2024-12-29": 46000,
    "2024-12-30": 45000,
    "2024-12-31": 48000
  },
  patient_count_by_age_group: {
    "0-9": 20,
    "10-19": 28,
    "20-29": 15,
    "30-39": 22,
    "40-49": 30,
    "50-59": 18,
    "60-69": 10,
    "70-79": 5
  },
  total_patient_count: 174,
  diff_rates: {
    total_visit_count: -17.63,
    total_cost: -19.08,
    chojin_rejin_visit_count: -8.62,
    sinhwan_visit_count: -28.99,
    average_cost_per_visit: -6.49,
    average_cost_per_patient: -5.89,
    total_patient_count: -11.49
  }
};

export const mockRegionInfo = {
  id: 15994,
  name: "서울특별시 강남구 역삼1동",
  population: 33359,
  male_population: 16269,
  female_population: 17090,
  male_avg_age: 42.2,
  female_avg_age: 41.6,
  total_avg_age: 41.9,
  monthly_avg_income: 3607265,
  medical_expense: 970000,
  total_cost: 45930,
  age_group_population: {
    "0-9": 785,
    "10-19": 1235,
    "20-29": 6462,
    "30-39": 9716,
    "40-49": 6115,
    "50-59": 4333,
    "60-69": 3022,
    "70-79": 1697,
    "80-89": 759,
    "90-99": 97,
    "100+": 2
  },
  population_by_day: [
    { day: "월요일", value: 117428 },
    { day: "화요일", value: 120292 },
    { day: "수요일", value: 119809 },
    { day: "목요일", value: 120179 },
    { day: "금요일", value: 116563 },
    { day: "토요일", value: 81569 },
    { day: "일요일", value: 71464 }
  ],
  population_by_time: {
    "8": 105992.66,
    "9": 131234.03,
    "10": 143853.8,
    "11": 152938.8,
    "12": 156837.13,
    "13": 159146.31,
    "14": 159918.27,
    "15": 157383.57,
    "16": 152792.88,
    "17": 145656.44,
    "18": 131361.77,
    "19": 116351.04,
    "20": 105055.16,
    "21": 92800.61,
    "22": 79567.17,
    "23": 68588.26
  }
};

export const mockMapByRegionStats = [
  {
    id: 1,
    data: "413명",
    diffRate: 14.02
  },
  {
    id: 2,
    data: "23,498,159 ₩",
    diffRate: 17
  },
  {
    id: 3,
    data: "54,520 ₩",
    diffRate: -55.21
  },
  {
    id: 4,
    data: "93,993 ₩",
    diffRate: 10.92
  },
  {
    id: 5,
    data: "277명",
    diffRate: 95.67
  },
  {
    id: 6,
    data: "155명",
    diffRate: -34.67
  },
  {
    id: 7,
    data: "준비중",
    diffRate: null
  },
  {
    id: 8,
    data: "5.87%",
    diffRate: -20
  }
];

export const mockMapByRegionRegionPrivate = {
  total_cost: 45930,
  total_patient_count: 1,
  total_visit_count: 1,
  average_cost_per_patient: 45930,
  average_cost_per_visit: 45930,
  average_cost_per_visit_by_date: {
    "2025-03-09": 45930,
    "2025-03-10": 25930,
    "2025-03-11": 35930,
    "2025-03-12": 25930,
    "2025-03-13": 25930
  },
  cost_by_date: {
    "2024-12-17": 890000,
    "2024-12-18": 1012000,
    "2024-12-19": 970000,
    "2024-12-20": 1100000,
    "2024-12-21": 1240000,
    "2024-12-22": 940000,
    "2024-12-23": 980000,
    "2024-12-24": 870000,
    "2024-12-25": 690000,
    "2024-12-26": 830000,
    "2024-12-27": 920000,
    "2024-12-28": 790000,
    "2024-12-29": 850000,
    "2024-12-30": 710000,
    "2024-12-31": 940000
  },
  chojin_rejin_visit_count: 1,
  sinhwan_visit_count: 0,
  patient_count_by_age_group: {
    "0-9": 5,
    "10-19": 10,
    "20-29": 70,
    "30-39": 60,
    "40-49": 344,
    "50-59": 157,
    "70-79": 100,
    "90-99": 1,
    "100+": 0
  },
  diff_rates: {
    average_cost_per_patient: -77.61,
    average_cost_per_visit: -55.21,
    chojin_rejin_visit_count: -66.67,
    sinhwan_visit_count: -100,
    total_cost: -88.8,
    total_patient_count: -50,
    total_visit_count: -75
  }
};
