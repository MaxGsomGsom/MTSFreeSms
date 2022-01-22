// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

import AsyncStorage from '@react-native-async-storage/async-storage';
type StorageKeys = "sender" | "receiver" | "text";
export type ReceiverData = { number: string, name: string};

export async function storeKey<T extends string | ReceiverData = string>(key: StorageKeys, value: T): Promise<void> {
    await AsyncStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

export async function getKey<T extends string | ReceiverData = string>(key: StorageKeys): Promise<T | undefined> {
    const result = await AsyncStorage.getItem(key);
    if (result === null)
        return;

    try {
        return JSON.parse(result) as T;
    } catch {
        return result as T;
    }
}