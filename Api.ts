import { ToastAndroid } from 'react-native';
import {
    Capcha, CapchaHeader,
    CheckCodeRequest, CheckCodeResponse,
    CodeResult, SendRequest, SendResponse,
} from './Models';
import { modifyCapchaCode } from './ModifyCapchaCode';

export async function getCapcha(): Promise<Capcha | undefined> {
    try {
        const result = await fetch('https://moskva.mts.ru/captcha/create', { method: 'POST' });
        return await result.json();
    } catch {
        ToastAndroid.show('Отсутствует интернет', ToastAndroid.SHORT);
    }
}

export async function sendSms(capcha: Capcha, capchaIds: number[], body: SendRequest): Promise<SendResponse | undefined> {
    const jscode = modifyCapchaCode(capcha.JSCode);
    // eslint-disable-next-line no-eval
    const secret = eval(jscode) as CodeResult;
    const capchaHeader: CapchaHeader = {
        ids: capchaIds,
        secretName: secret.secretName,
        secretValue: secret.secretValue,
        id: capcha.Id,
    };

    const headers = {
        ['X-QA-CAPTCHA']: JSON.stringify(capchaHeader),
        ['Content-Type']: 'application/json',
    };
    try {
        const result = await fetch('https://moskva.mts.ru/json/smspage/Send',
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body),
            });
        return await result.json();
    } catch {
        ToastAndroid.show('Отсутствует интернет', ToastAndroid.SHORT);
    }
}

export async function checkCode(request: CheckCodeRequest): Promise<CheckCodeResponse | undefined> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    try {
        const result = await fetch('https://moskva.mts.ru/json/smspage/SendSms',
            {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(request),
            });
        return await result.json();
    } catch {
        ToastAndroid.show('Отсутствует интернет', ToastAndroid.SHORT);
    }
}
