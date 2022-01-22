import {
  Button, Image, StyleSheet, Text,
  TextInput, View, TouchableHighlight, PermissionsAndroid, ToastAndroid
} from 'react-native';
import { useEffect, useState } from "react";
import { checkCode, getCapcha, sendSms } from "./Api";
import { Capcha, CheckCodeRequest, SendRequest } from "./Models";
import DeviceInfo from 'react-native-device-info';
import { waitCode } from "./WaitCode";
import { selectContactPhone } from "react-native-select-contact";
import { getKey, ReceiverData, storeKey } from "./Storage";
import Spinner from 'react-native-loading-spinner-overlay';
import { normalizePhone } from "./NormalizePhone";

export default function App() {
  // fields
  const [sender, setSender] = useState<string>("");
  const [receiver, setReceiver] = useState<ReceiverData>({ number: "", name: "" });
  const [text, setText] = useState<string>("");
  const [capchaImages, setCapchaImages] = useState<JSX.Element[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set<number>());
  const [capchaSrc, setCapcha] = useState<Capcha | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // init
  useEffect(() => { init(); }, []);

  // functions
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

  async function setSenderFromSavedOrNumber(): Promise<void> {
    let phone = await getKey("sender");
    if (!phone) {
      phone = await DeviceInfo.getPhoneNumber();
    }

    if (phone) {
      setSender(normalizePhone(phone));
      console.log("Set sender: " + phone);
    }
  }

  function getCapchaImageBase64(capcha: Capcha, number: number): string | undefined {
    return "data:image/png;base64," + capcha.Images[number];
  }

  async function send(): Promise<void> {
    if (!capchaSrc || !text || !sender || !receiver || !selectedImages.size) {
      ToastAndroid.show('Заполните все поля', ToastAndroid.SHORT);
      return;
    }

    const body: SendRequest = {
      sender: sender,
      receiver: receiver.number,
      message: text,
    };

    const selected = Array.from(selectedImages);
    const sendResult = await sendSms(capchaSrc, selected, body);
    console.log("Send result: " + sendResult?.isValid);

    if (!sendResult) {
      await requestCapcha();
      return;
    }
    if (!sendResult.isValid) {
      ToastAndroid.show('Неправильная капча', ToastAndroid.SHORT);
      await requestCapcha();
      return;
    }

    // Получим время предыдущего сообщения
    const lastSms = await waitCode(undefined);
    let lastSmsTime = lastSms?.date;
    if (lastSmsTime)
      lastSmsTime++;
    console.log("Previous confirmation SMS time: " + lastSmsTime);

    // Ждем следующего
    waitConfirmationCode(lastSmsTime, sendResult!.tempDataId);
  }


  function waitConfirmationCode(lastSmsTime: number | undefined, tempDataId: string): void {
    setIsLoading(true);
    let i = 0;
    function iterate(): void {
      setTimeout(async () => {
        const result = await waitCode(lastSmsTime);
        if (!result && i < 30) {
          i++;
          iterate();
          return;
        }

        await sendConfirmation(result?.code, tempDataId);
      }, 1000);
    }

    iterate();
  }

  function selectContact(): void {
    selectContactPhone()
      .then(selection => {
        if (!selection)
          return;

        let { contact, selectedPhone } = selection;
        setReceiverAndStore(normalizePhone(selectedPhone.number), contact.name);
        console.log("Receiver from contacts: " + selectedPhone.number);
      });
  }


  async function sendConfirmation(code: number | undefined, tempDataId: string): Promise<void> {
    setIsLoading(false);
    if (!code) {
      ToastAndroid.show('Не удалось получить код подверждения', ToastAndroid.SHORT);
      await requestCapcha();
      return;
    }

    const checkRequest: CheckCodeRequest = {
      tempDataId: tempDataId,
      verificationCode: code.toString()
    };

    const checkResult = await checkCode(checkRequest);
    console.log("Confirmation check result: " + checkResult?.isSucceeded);
    if (!checkResult?.isSucceeded) {
      ToastAndroid.show('Не удалось подтвердить отправку СМС', ToastAndroid.SHORT);
      await requestCapcha();
      return;
    }

    ToastAndroid.show('Сообщение отправлено', ToastAndroid.SHORT);
    setTextAndStore("");
    await requestCapcha();
  }

  async function init() {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);

    await setSenderFromSavedOrNumber();
    const receiverValue = await getKey<ReceiverData>("receiver");
    if (receiverValue)
      setReceiver(receiverValue);
    const textValue = await getKey("text");
    if (textValue)
      setText(textValue);

    await requestCapcha();
  };

  async function requestCapcha(): Promise<void> {
    const capcha = await getCapcha();
    if (!capcha)
      return;

    selectedImages.clear();
    setSelectedImages(selectedImages);
    setCapchaImages(createImages(capcha, selectedImages));
    setCapcha(capcha);
  }

  function setTextAndStore(value: string): void {
    storeKey("text", value);
    setText(value);
  }

  function setSenderAndStore(number: string): void {
    const phone = normalizePhone(number);
    storeKey("sender", phone);
    setSender(phone);
  }

  function setReceiverAndStore(number: string, name?: string): void {
    const result: ReceiverData = { number: normalizePhone(number), name: name || "" };
    storeKey<ReceiverData>("receiver", result);
    setReceiver(result);
  }

  function getQuestion(): string | undefined {
    const result = capchaSrc?.Question
      .replace("Выберите <b>все</b> изображения по следующим признакам:<br> <b>тип</b> - ", "")
      .replace("<b>", "")
      .replace("</b>", "");
    if (!result)
      return;

    return result[0].toUpperCase() + result.substring(1);
  }

  function getSymbolsCount(): string {
    return text.length + "/" + (/[А-Яа-я]/.test(text) ? 70 : 160);
  }

  // return
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
      <Text style={styles.title}>MTS Free SMS</Text>
      <Text style={styles.subTitle}>Отправка 10 бесплатных сообщений в день с номеров МТС на МТС</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text>Отправитель</Text>
        <TextInput
          style={styles.textField}
          onChangeText={setSenderAndStore}
          value={sender}
        ></TextInput>
      </View>

      <View style={styles.inputGroup}>
        <Text>Получатель</Text>
        <View style={styles.horizontalContainer}>
        <TextInput
          style={styles.textField}
          onChangeText={setReceiverAndStore}
          value={receiver.number}
        ></TextInput>
        <Button
          color="gray"
          title="Контакты"
          onPress={selectContact}></Button>
          </View>
          <Text style={styles.grayText}>{receiver.name}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text>Текст сообщения</Text>
        <TextInput
          style={styles.textFieldMultiline}
          numberOfLines={5}
          multiline={true}
          onChangeText={setTextAndStore}
          value={text}
        ></TextInput>
        <Text style={styles.grayText}>{getSymbolsCount()}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text>Капча</Text>
        <View style={styles.horizontalContainer}>{capchaImages}</View>
        <Text style={styles.grayText}>{getQuestion()}</Text>
      </View>

      <Button
        color="gray"
        title="Отправить"
        onPress={send}></Button>

      <Spinner
        visible={isLoading}
        textContent={"Ожидание СМС с кодом"}
        overlayColor="rgba(0, 0, 0, 0.75)"
        textStyle={styles.spinnerText}
      />
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
    paddingLeft: 10,
    paddingRight: 10,
    flexGrow: 1,
  },
  textFieldMultiline: {
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    flexGrow: 1,
    textAlignVertical: "top"
  },
  capchaImage: {
    width: 50,
    height: 50
  },
  capchaImageSelected: {
    width: 50,
    height: 50,
    backgroundColor: "gray"
  },
  horizontalContainer: {
    flexDirection: "row",
    display: "flex"
  },
  spinnerText: {
    color: 'white'
  },
  inputGroup: {
    width: "75%",
    marginBottom: 20,
    display: "flex"
  },
  grayText: {
    color: "gray"
  },
  title: {
    fontSize: 20,
    textAlign: "center"
  },
  subTitle: {
    textAlign: "center"
  }
});