// auth.d.ts

declare module "#auth-utils" {
  interface User {
    id: number;
    email: string;
    fullname: string;
    role: string
  }

  interface UserSession {}

  interface SecureSessionData {
    // Add your own fields
  }
}

export {};
