// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

import SmsAndroid from 'react-native-get-sms-android';

export function waitCode(lastSmsTime: number | undefined): Promise<{ code: number, date: number } | undefined> {
  return new Promise<{ code: number, date: number } | undefined>((resolve, reject) => {
    var filter = {
      box: 'inbox',
      minDate: lastSmsTime ?? (Date.now() - 24 * 60 * 60 * 1000),
      address: "MTC"
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: any) => reject('Failed with this error: ' + fail),
      async (count: number, smsList: string) => {
        const list: any[] = JSON.parse(smsList);
        const message = list?.[0];
        const code = message?.body.match(/\d+/)?.[0];
        console.log("Confirmation code found: " + code);

        if (!code) {
          resolve(undefined);
          return;
        }

        resolve({ code: +code, date: message.date});
      },
    );
  });
}