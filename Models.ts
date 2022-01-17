// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

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
};

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