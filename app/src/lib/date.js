const map = {
  //enYear: [npYear, np day for Jan 1, total days in Poush, ... , total days in Mangshir, total days in Poush]
  2024: [2080, 16, 29, 29, 30, 30, 31, 32, 31, 32, 31, 30, 30, 30, 29],
  2025: [2081, 17, 29, 30, 29, 31, 31, 31, 32, 31, 31, 31, 30, 29, 30],
  2026: [2082, 17, 30, 29, 30, 30, 31, 31, 32, 31, 31, 31, 30, 29, 30],
  2027: [2083, 17, 30, 29, 30, 30, 31, 32, 31, 32, 31, 30, 30, 30, 29],
  2028: [2084, 17, 29, 29, 30, 31, 30, 32, 31, 32, 31, 30, 30, 30, 29],
  2029: [2085, 17, 29, 30, 29, 31, 31, 31, 32, 31, 31, 31, 30, 29, 30],
  2030: [2086, 17, 30, 29, 30, 30, 31, 31, 32, 32, 31, 30, 30, 29, 30],
};

export class NepaliDate {
  static getNepaliDate() {
    const en = new Date();
    const enYear = en.getFullYear();
    const enDayOfYear = Math.floor((en - new Date(en.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

    let npYear = map[enYear][0];
    let npMonth = 9;
    let npDaysInMonth = map[enYear][2];

    let npTempDays = map[enYear][2] - map[enYear][1] + 1;

    for (let i = 3; enDayOfYear > npTempDays; i++) {
      npTempDays += map[enYear][i];
      npDaysInMonth = map[enYear][i];
      npMonth++;
      if (npMonth > 12) {
        npMonth -= 12;
        npYear++;
      }
    }

    const npDay = npDaysInMonth - (npTempDays - enDayOfYear);

    return [npYear, String(npMonth).padStart(2, '0'), String(npDay).padStart(2, '0')].join('-');
  }
}
