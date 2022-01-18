// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

import { Capcha, CheckCodeRequest } from "./Models";
import SmsAndroid from 'react-native-get-sms-android';
import { checkCode } from "./Api";

export function waitCode(tempDataId: string, minDate: number): Promise<boolean> {
  return new Promise<boolean>((resolve, reject) => {
    var filter = {
      box: 'inbox',
      minDate: minDate,
      bodyRegex: '(.*)Вы или кто-то другой пытается отправить бесплатное сообщение с сайта МТС(.*)',
      maxCount: 1,
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: any) => reject('Failed with this error: ' + fail),
      async (count: number, smsList: string) => {
        const list: any[] = JSON.parse(smsList);
        const message = list?.[0]?.body;
        const code = message?.match(/\d+/)?.[0];
        console.log("CODE: " + code);

        if (code) {
          var checkRequest: CheckCodeRequest = {
            tempDataId: tempDataId,
            verificationCode: code
          };

          const checkResult = await checkCode(checkRequest);
          console.log("CHECK RESULT: " + checkResult);
          resolve(true);
        }

        resolve(false);
      },
    );
  });
}