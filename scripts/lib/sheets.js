import { google } from 'googleapis';

function loadServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수가 없습니다 (부록 B 항목 2 참조). ' +
        '.env.example을 참고해 서비스 계정 JSON 키 전체를 문자열로 설정하세요.',
    );
  }
  return JSON.parse(raw);
}

export async function getAuthorizedClients() {
  const credentials = loadServiceAccountCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
  const authClient = await auth.getClient();
  return {
    sheets: google.sheets({ version: 'v4', auth: authClient }),
    drive: google.drive({ version: 'v3', auth: authClient }),
  };
}

// 헤더 행에서 "Q5", "Q24" 등의 문항 번호가 포함된 열을 찾아 { Q5: 0, Q24: 3, ... } 형태로 반환.
// 실제 시트의 헤더 문구가 "Q5. 기업명" 처럼 문항 번호를 포함한다는 전제 (2.2절 설문 문항 목록 참조).
export function buildHeaderIndex(headerRow) {
  const index = {};
  headerRow.forEach((cell, i) => {
    const match = String(cell ?? '').match(/Q(\d{1,2})/);
    if (match) index[`Q${match[1]}`] = i;
  });
  return index;
}

export async function fetchSheetRows(sheets, spreadsheetId, range) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values ?? [];
}

export async function fetchFileModifiedTime(drive, fileId) {
  const res = await drive.files.get({ fileId, fields: 'modifiedTime' });
  return res.data.modifiedTime;
}
