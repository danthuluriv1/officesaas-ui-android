export interface UserClaims {
  userId: string;
  email: string;
  role: string;
  officeId: string;
  officeName: string;
  firstName: string;
  lastName: string;
}

export function decodeJwt(token: string): UserClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Replace URL-safe base64 characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const rawClaims = JSON.parse(jsonPayload);
    
    return {
      userId: rawClaims.nameid || '',
      email: rawClaims.email || '',
      role: rawClaims.role || '',
      officeId: rawClaims.OfficeId || '',
      officeName: rawClaims.OfficeName || '',
      firstName: rawClaims.FirstName || '',
      lastName: rawClaims.LastName || '',
    };
  } catch (error) {
    console.error('[JWT Decode] Failed to parse token:', error);
    return null;
  }
}
