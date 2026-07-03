import type { Locale } from './i18n';

// UN SDG 17개 목표 — 짧은 명칭만 배지에 사용 (8장: 모노톤 아웃라인 배지, 공식 컬러 아이콘 미사용).
const SDG_NAMES: Record<number, Record<Locale, string>> = {
  1: { vi: 'Xóa nghèo', en: 'No Poverty', ko: '빈곤 퇴치' },
  2: { vi: 'Không còn nạn đói', en: 'Zero Hunger', ko: '기아 종식' },
  3: { vi: 'Sức khỏe', en: 'Good Health', ko: '건강과 웰빙' },
  4: { vi: 'Giáo dục chất lượng', en: 'Quality Education', ko: '양질의 교육' },
  5: { vi: 'Bình đẳng giới', en: 'Gender Equality', ko: '성평등' },
  6: { vi: 'Nước sạch', en: 'Clean Water', ko: '물과 위생' },
  7: { vi: 'Năng lượng sạch', en: 'Clean Energy', ko: '깨끗한 에너지' },
  8: { vi: 'Việc làm bền vững', en: 'Decent Work', ko: '양질의 일자리' },
  9: { vi: 'Công nghiệp & Đổi mới', en: 'Industry & Innovation', ko: '산업, 혁신 인프라' },
  10: { vi: 'Giảm bất bình đẳng', en: 'Reduced Inequalities', ko: '불평등 감소' },
  11: { vi: 'Thành phố bền vững', en: 'Sustainable Cities', ko: '지속가능도시' },
  12: { vi: 'Tiêu dùng bền vững', en: 'Responsible Consumption', ko: '지속가능 생산소비' },
  13: { vi: 'Hành động khí hậu', en: 'Climate Action', ko: '기후변화 대응' },
  14: { vi: 'Tài nguyên nước', en: 'Life Below Water', ko: '해양생태계' },
  15: { vi: 'Tài nguyên đất', en: 'Life on Land', ko: '육상생태계' },
  16: { vi: 'Hòa bình & Công lý', en: 'Peace & Justice', ko: '평화, 정의, 제도' },
  17: { vi: 'Hợp tác toàn cầu', en: 'Partnerships', ko: '이행수단과 파트너십' },
};

export function sdgLabel(num: number, locale: Locale): string {
  return SDG_NAMES[num]?.[locale] ?? `SDG ${num}`;
}
