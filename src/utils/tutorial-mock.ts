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

export const mockMapByRegionStats = {
  1: { data: "257명", diffRate: -17.63 },
  2: { data: "11,206,890 ₩", diffRate: -19.08 },
  3: { data: "48,950 ₩", diffRate: 6.49 },
  4: { data: "65,200 ₩", diffRate: -5.89 },
  5: { data: "159명", diffRate: 8.62 },
  6: { data: "98명", diffRate: 28.99 },
  7: { data: "준비중" },
  8: { data: "0 %", diffRate: -24.11 }
};

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

export const mockDashboard = {
  average_cost_per_patient: 81259.12,
  average_cost_per_visit: 54920,
  average_cost_per_visit_by_date: {
    "2024-11-30": 53609,
    "2024-12-01": 55416,
    "2024-12-02": 54919,
    "2024-12-03": 56779,
    "2024-12-04": 56002,
    "2024-12-05": 55606,
    "2024-12-06": 56600,
    "2024-12-07": 54904,
    "2024-12-08": 54555,
    "2024-12-09": 53064,
    "2024-12-10": 56249,
    "2024-12-11": 54699,
    "2024-12-12": 53981,
    "2024-12-13": 53776,
    "2024-12-14": 57900,
    "2024-12-15": 54688,
    "2024-12-16": 55462,
    "2024-12-17": 55054,
    "2024-12-18": 53281,
    "2024-12-19": 55337,
    "2024-12-20": 55128,
    "2024-12-21": 54746,
    "2024-12-22": 54336,
    "2024-12-23": 55328,
    "2024-12-24": 56636,
    "2024-12-25": 56314,
    "2024-12-26": 54771,
    "2024-12-27": 51669,
    "2024-12-28": 53792,
    "2024-12-29": 53039,
    "2024-12-30": 57645,
    "2024-12-31": 53622
  },
  chojin_rejin_visit_count: 3592,
  sinhwan_visit_count: 4010,
  cost_by_date: {
    "2024-11-30": 10668262,
    "2024-12-01": 12468691,
    "2024-12-02": 9885568,
    "2024-12-03": 9311877,
    "2024-12-04": 9688422,
    "2024-12-05": 8897089,
    "2024-12-06": 9169247,
    "2024-12-07": 10706366,
    "2024-12-08": 14075285,
    "2024-12-09": 10559845,
    "2024-12-10": 10124954,
    "2024-12-11": 8423773,
    "2024-12-12": 8529066,
    "2024-12-13": 10002480,
    "2024-12-14": 13259282,
    "2024-12-15": 16625156,
    "2024-12-16": 12756467,
    "2024-12-17": 9524413,
    "2024-12-18": 8525004,
    "2024-12-19": 9684035,
    "2024-12-20": 9923210,
    "2024-12-21": 14890945,
    "2024-12-22": 18691789,
    "2024-12-23": 14606795,
    "2024-12-24": 13762555,
    "2024-12-25": 22694864,
    "2024-12-26": 15116859,
    "2024-12-27": 12969158,
    "2024-12-28": 19903375,
    "2024-12-29": 23390330,
    "2024-12-30": 20925298,
    "2024-12-31": 17748891
  },
  diff_rates: {
    average_cost_per_patient: -4.25,
    average_cost_per_visit: -0.56,
    chojin_rejin_visit_count: 64.24,
    sinhwan_visit_count: -1.62,
    total_cost: 20.7,
    total_patient_count: 26.05,
    total_visit_count: 21.38
  },
  patient_count_by_age_group: {
    "0-9": 674,
    "10-19": 683,
    "20-29": 358,
    "30-39": 483,
    "40-49": 523,
    "50-59": 327,
    "60-69": 262,
    "70-79": 114,
    "80+": 24,
    Unknown: 1690
  },
  topRegions: [
    {
      region_name: "신정3동 A",
      visit_count: 842,
      chojin_rejin_count: 546,
      sinhwan_count: 296,
      total_cost: 45420306
    },
    {
      region_name: "신월2동 B",
      visit_count: 534,
      chojin_rejin_count: 326,
      sinhwan_count: 208,
      total_cost: 29401847
    },
    {
      region_name: "신월2동 A",
      visit_count: 431,
      chojin_rejin_count: 276,
      sinhwan_count: 155,
      total_cost: 23498159
    },
    {
      region_name: "신월6동 A",
      visit_count: 395,
      chojin_rejin_count: 237,
      sinhwan_count: 158,
      total_cost: 22467302
    },
    {
      region_name: "신정4동 A",
      visit_count: 275,
      chojin_rejin_count: 176,
      sinhwan_count: 99,
      total_cost: 15284394
    },
    {
      region_name: "신정1동 A",
      visit_count: 247,
      chojin_rejin_count: 163,
      sinhwan_count: 84,
      total_cost: 13687162
    },
    {
      region_name: "신정1동 B",
      visit_count: 243,
      chojin_rejin_count: 143,
      sinhwan_count: 100,
      total_cost: 13505005
    }
  ],
  total_cost: 417509351,
  total_patient_count: 5138,
  total_visit_count: 7602
};

export const mockStatisticsByRegion = [
  {
    region_name: "가양1동 A",
    population: 12456,
    total_visit_count: 287,
    total_cost: 15394820,
    chojin_rejin_visit_count: 165,
    sinhwan_visit_count: 122,
    total_patient_count: 229,
    average_cost_per_patient: 67220,
    average_cost_per_visit: 53650,
    average_patient_age: 35.2
  },
  {
    region_name: "등촌3동 B",
    population: 9820,
    total_visit_count: 198,
    total_cost: 10938290,
    chojin_rejin_visit_count: 101,
    sinhwan_visit_count: 97,
    total_patient_count: 163,
    average_cost_per_patient: 67080,
    average_cost_per_visit: 55245,
    average_patient_age: 33.7
  },
  {
    region_name: "발산1동 A",
    population: 14327,
    total_visit_count: 345,
    total_cost: 18752000,
    chojin_rejin_visit_count: 200,
    sinhwan_visit_count: 145,
    total_patient_count: 278,
    average_cost_per_patient: 67460,
    average_cost_per_visit: 54355,
    average_patient_age: 36.1
  },
  {
    region_name: "가양3동 B",
    population: 11089,
    total_visit_count: 163,
    total_cost: 9257000,
    chojin_rejin_visit_count: 91,
    sinhwan_visit_count: 72,
    total_patient_count: 145,
    average_cost_per_patient: 63841,
    average_cost_per_visit: 56791,
    average_patient_age: 32.4
  },
  {
    region_name: "염창2동 A",
    population: 8760,
    total_visit_count: 142,
    total_cost: 8032400,
    chojin_rejin_visit_count: 78,
    sinhwan_visit_count: 64,
    total_patient_count: 128,
    average_cost_per_patient: 62753,
    average_cost_per_visit: 56565,
    average_patient_age: 31.9
  },
  {
    region_name: "마곡1동 A",
    population: 15010,
    total_visit_count: 310,
    total_cost: 17200000,
    chojin_rejin_visit_count: 180,
    sinhwan_visit_count: 130,
    total_patient_count: 255,
    average_cost_per_patient: 67451,
    average_cost_per_visit: 55483,
    average_patient_age: 34.8
  },
  {
    region_name: "마곡2동 B",
    population: 10200,
    total_visit_count: 189,
    total_cost: 9850000,
    chojin_rejin_visit_count: 105,
    sinhwan_visit_count: 84,
    total_patient_count: 150,
    average_cost_per_patient: 65666,
    average_cost_per_visit: 52116,
    average_patient_age: 33.5
  },
  {
    region_name: "등촌1동 A",
    population: 11500,
    total_visit_count: 212,
    total_cost: 11284000,
    chojin_rejin_visit_count: 117,
    sinhwan_visit_count: 95,
    total_patient_count: 172,
    average_cost_per_patient: 65605,
    average_cost_per_visit: 53226,
    average_patient_age: 32.1
  },
  {
    region_name: "등촌2동 B",
    population: 10950,
    total_visit_count: 195,
    total_cost: 10340000,
    chojin_rejin_visit_count: 110,
    sinhwan_visit_count: 85,
    total_patient_count: 160,
    average_cost_per_patient: 64625,
    average_cost_per_visit: 53025,
    average_patient_age: 34.0
  },
  {
    region_name: "화곡9동 A",
    population: 9870,
    total_visit_count: 178,
    total_cost: 9200000,
    chojin_rejin_visit_count: 98,
    sinhwan_visit_count: 80,
    total_patient_count: 148,
    average_cost_per_patient: 62162,
    average_cost_per_visit: 51685,
    average_patient_age: 33.2
  },
  {
    region_name: "방화1동 B",
    population: 14020,
    total_visit_count: 301,
    total_cost: 16520000,
    chojin_rejin_visit_count: 175,
    sinhwan_visit_count: 126,
    total_patient_count: 240,
    average_cost_per_patient: 68833,
    average_cost_per_visit: 54884,
    average_patient_age: 36.4
  },
  {
    region_name: "방화2동 A",
    population: 11830,
    total_visit_count: 254,
    total_cost: 13832000,
    chojin_rejin_visit_count: 140,
    sinhwan_visit_count: 114,
    total_patient_count: 208,
    average_cost_per_patient: 66500,
    average_cost_per_visit: 54457,
    average_patient_age: 35.0
  }
];
