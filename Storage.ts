import AsyncStorage from '@react-native-async-storage/async-storage';
type StorageKeys = 'sender' | 'receiver' | 'text';
export type ReceiverData = { number: string, name: string};

export async function storeKey<T extends string | ReceiverData = string>(key: StorageKeys, value: T): Promise<void> {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export async function getKey<T extends string | ReceiverData = string>(key: StorageKeys): Promise<T | undefined> {
    const result = await AsyncStorage.getItem(key);
    if (result === null) {
        return;
    }

    try {
        return JSON.parse(result) as T;
    } catch {
        return result as T;
    }
}
