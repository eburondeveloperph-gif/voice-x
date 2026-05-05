import { auth } from '../firebase';
import { useAuth } from './state';

export async function googleFetch(url: string, options: RequestInit = {}, passedToken?: string) {
  const token = passedToken || useAuth.getState().googleAccessToken;

  if (!token) {
    throw new Error('Google services are not connected. Sign in with Google again from Profile.');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    useAuth.getState().setGoogleAccessToken(null);
    throw new Error(
      'Google permission expired or was revoked. Please use the Reconnect Google button to reconnect Gmail, Drive, and Calendar.'
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Service API error ${res.status}: ${text || res.statusText}`);
  }

  return res;
}

export async function googleJson(url: string, options: RequestInit = {}, passedToken?: string) {
  const res = await googleFetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  }, passedToken);
  return res.json();
}

export function getCurrentUserEmail() {
  return auth.currentUser?.email || '';
}

export async function searchDriveFirst(q: string, passedToken?: string) {
  const escaped = q.replace(/'/g, "\\'");
  const result = await googleJson(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name contains '${escaped}' and trashed = false`)}&fields=files(id,name,mimeType,webViewLink,webContentLink,modifiedTime)&pageSize=1`,
        {},
        passedToken
  );
  return result.files?.[0] || null;
}

export async function createGoogleDoc(title: string, content: string, passedToken?: string) {
  const doc = await googleJson('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    body: JSON.stringify({ title }),
  }, passedToken);

  if (content?.trim()) {
    await googleJson(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests:[
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    }, passedToken);
  }

  const file = await googleJson(
        `https://www.googleapis.com/drive/v3/files/${doc.documentId}?fields=id,name,mimeType,webViewLink`,
        {},
        passedToken
  );

  return { ...doc, driveFile: file };
}

export async function exportDriveFile(fileId: string, mimeType: string, passedToken?: string) {
  const res = await googleFetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(mimeType)}`,
        {},
        passedToken
  );
  return res.blob();
}

export async function uploadTextFileToDrive(fileName: string, content: string, mimeType = 'text/plain', folderId?: string, passedToken?: string) {
  const metadata: any = { name: fileName };
  if (folderId) metadata.parents =[folderId];

  const boundary = `boundary_${Date.now()}`;

  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content || ''}\r\n` +
    `--${boundary}--`;

  return googleFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
    passedToken
  ).then(r => r.json());
}

export async function sendGmail({
  to,
  subject,
  body,
  cc,
  bcc,
  attachment,
}: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachment?: {
    filename: string;
    mimeType: string;
    base64Content: string;
  };
}, passedToken?: string) {
  const { buildEmailRaw } = await import('./app-helpers');
  const raw = buildEmailRaw({ to, subject, body, cc, bcc, attachment });

  return googleJson('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw }),
  }, passedToken);
}
