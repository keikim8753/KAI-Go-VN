// 8장 — 1차 기계번역 초안 생성. TRANSLATE_API_KEY가 없으면 번역을 시도하지 않고
// 원문을 그대로 두되 "[번역 필요]" 표시를 붙여 현지 검수자(Trang/Tram)가 육안으로
// 미번역 항목을 즉시 찾을 수 있게 한다.
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY;

const TARGET_LANG = { en: 'en', vi: 'vi' };

export async function translateText(koText, targetLocale) {
  if (!koText) return '';
  if (!TRANSLATE_API_KEY) {
    return `[번역 필요] ${koText}`;
  }

  const target = TARGET_LANG[targetLocale];
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${TRANSLATE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: koText, source: 'ko', target, format: 'text' }),
    },
  );

  if (!res.ok) {
    console.warn(`[translate] API 호출 실패 (${res.status}) — 원문을 표시용으로 대체합니다.`);
    return `[번역 필요] ${koText}`;
  }

  const body = await res.json();
  return body.data?.translations?.[0]?.translatedText ?? `[번역 필요] ${koText}`;
}
