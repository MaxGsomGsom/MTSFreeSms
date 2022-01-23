export interface Capcha {
  readonly Id: string;
  readonly Images: string[];
  JSCode: string;
  readonly Question: string;
}

export interface CodeResult {
  readonly secretName: string;
  readonly secretValue: number;
}

export interface SendRequest {
  readonly sender: string;
  readonly receiver: string;
  readonly message: string;
}

export interface CapchaHeader {
  readonly ids: number[];
  readonly secretName: string;
  readonly secretValue: number;
  readonly id: string;
}

export interface SendResponse {
  readonly isValid: boolean;
  readonly tempDataId: string;
}

export interface CheckCodeRequest {
  readonly verificationCode: string;
  readonly tempDataId: string;
}

export interface CheckCodeResponse {
  readonly isSucceeded: boolean;
  readonly messageId: string;
}
