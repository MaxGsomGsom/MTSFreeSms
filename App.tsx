import {
  Button, Image, StyleSheet, Text,
  TextInput, View, TouchableHighlight, PermissionsAndroid
} from 'react-native';
import { useEffect, useState } from "react";
import { getCapcha, sendSms } from "./Api";
import { Capcha, SendRequest } from "./Models";
import DeviceInfo from 'react-native-device-info';
import { waitCode } from "./WaitCode";

export default function App() {
  const [sender, setSender] = useState<string | undefined>("9112349464");
  const [receiver, setReceiver] = useState<string | undefined>("9109981293");
  const [text, setText] = useState<string | undefined>("test");
  const [capchaImages, setCapchaImages] = useState<JSX.Element[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set<number>());
  const [capchaSrc, setCapcha] = useState<Capcha | undefined>();

  function updateSelectedImages(capcha: Capcha, i: number): void {
    if (!selectedImages.has(i))
      selectedImages.add(i);
    else
      selectedImages.delete(i);

    setSelectedImages(selectedImages);
    setCapchaImages(createImages(capcha, selectedImages));
  }

  function createImages(capcha: Capcha, selectedImages: Set<number>): JSX.Element[] {
    const result = [];
    for (let i = 0; i < capcha.Images.length; i++) {
      result.push(
        <TouchableHighlight key={i} onPress={() => updateSelectedImages(capcha, i)}>
          <Image
            source={{ uri: getCapchaImageBase64(capcha, i) }}
            style={selectedImages.has(i) ? styles.capchaImageSelected : styles.capchaImage}
          ></Image>
        </TouchableHighlight>
      );
    }

    return result;
  }

  async function send(): Promise<void> {
    const phone = await DeviceInfo.getPhoneNumber();
    if (phone)
      setSender(phone);
    console.log("PHONE: " + phone);

    if (!capchaSrc || !text || !sender || !receiver)
      return;

    const body: SendRequest = {
      sender: sender,
      receiver: receiver,
      message: text,
    };

    const selected = Array.from(selectedImages);
    var sendResult = await sendSms(capchaSrc, selected, body);
    console.log("SEND RESULT: " + sendResult.isValid);

    if (!sendResult.isValid) {
      await requestCapcha();
      return;
    }

    // Получим время предыдущего сообщения
    let lastSmsTime = await waitCode(sendResult.tempDataId, undefined);
    if (lastSmsTime)
      lastSmsTime++;
    console.log("LAST SMS TIME: " + lastSmsTime);

    //Ждем следующего
    let i = 0;
    function iterate(): void {
      setTimeout(async () => {
        const result = await waitCode(sendResult.tempDataId, lastSmsTime);
        if (!result && i < 30) {
          i++;
          iterate();
          return;
        }
      }, 1000);
    }

    iterate();
  }

  useEffect(() => {
    (async () => {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      await requestCapcha();
    })();
  }, []);

  async function requestCapcha(): Promise<void> {
    const capcha = await getCapcha();
    if (!capcha)
      return;

    selectedImages.clear();
    setSelectedImages(selectedImages);
    setCapchaImages(createImages(capcha, selectedImages));
    setCapcha(capcha);
  }

  return (
    <View style={styles.container}>
      <Text>Sender</Text>
      <TextInput
        style={styles.textField}
        onChangeText={setSender}
      ></TextInput>

      <Text>Receiver</Text>
      <TextInput
        style={styles.textField}
        onChangeText={setReceiver}
      ></TextInput>

      <Text>Text</Text>
      <TextInput
        style={styles.textField}
        numberOfLines={5}
        onChangeText={setText}
      ></TextInput>

      <Text>Capcha</Text>

      <View style={styles.horizontalContainer}>{capchaImages}</View>

      <Text>{capchaSrc?.Question}</Text>

      <Button
        title="Send"
        onPress={send}></Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textField: {
    borderWidth: 1,
    width: "75%",
    paddingLeft: 10,
    paddingRight: 10
  },
  capchaImage: {
    width: 50,
    height: 50
  },
  capchaImageSelected: {
    width: 50,
    height: 50,
    backgroundColor: "black"
  },
  horizontalContainer: {
    flexDirection: "row"
  }
});

export function getCapchaImageBase64(capcha: Capcha, number: number): string | undefined {
  return "data:image/png;base64," + capcha.Images[number];
}