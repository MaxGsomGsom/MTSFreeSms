// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

import {
    Capcha, CapchaHeader,
    CheckCodeRequest, CheckCodeResponse,
    CodeResult, SendRequest, SendResponse
} from "./Models";
import { modifyCapchaCode } from "./ModifyCapchaCode";

export function getCapcha(): Promise<Capcha> {
    return fetch('https://moskva.mts.ru/captcha/create', { method: 'POST' })
        .then(async response => await response.json());
}

export function sendSms(capcha: Capcha, capchaIds: number[], body: SendRequest): Promise<SendResponse> {
    const jscode = modifyCapchaCode(capcha.JSCode);
    if (!jscode)
        return Promise.reject("Wrong capcha JS code");

    const secret = eval(jscode) as CodeResult;
    const capchaHeader: CapchaHeader = {
        ids: capchaIds,
        secretName: secret.secretName,
        secretValue: secret.secretValue,
        id: capcha.Id
    };

    const headers = {
        ["X-QA-CAPTCHA"]: JSON.stringify(capchaHeader),
        ["Content-Type"]: "application/json",
        ["Accept"]: "application/json, text/plain, */*",
    };

    return fetch('https://moskva.mts.ru/json/smspage/Send',
    {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
    }).then(async response => await response.json());
}

export function checkCode(request: CheckCodeRequest): Promise<CheckCodeResponse> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");

    return fetch('https://moskva.mts.ru/json/smspage/SendSms',
    {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request)
    }).then(async response => await response.json());
}