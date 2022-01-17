import { Button, Image, StyleSheet, Text, TextInput, View, TouchableHighlight } from 'react-native';
import { useEffect, useState } from "react";
import { getCapcha, sendSms } from "./Api";
import { Capcha, SendRequest, SendResponse } from "./Models";
import { getCapchaImageBase64 } from "./Helpers";

export default function App() {
  const [sender, setSender] = useState<string | undefined>("+79112349464");
  const [receiver, setReceiver] = useState<string | undefined>("+79818636483");
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

  function send(): void {
    if (!capchaSrc || !text || !sender || !receiver)
      return;

    const body: SendRequest = {
      message: text,
      receiver: receiver,
      sender: sender
    };

    const selected = Array.from(selectedImages).map(val => val + 1);
    sendSms(capchaSrc, selected, body).then(result => {
      console.log(result);
    });
  }

  /*useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Emails],
        });

        if (data.length > 0) {
          const contact = data[0];
          console.log(contact);
        }
      }
    })();
  }, []);*/

  useEffect(() => {
    (async () => {
      const capcha = await getCapcha();

      if (!capcha)
        return;


      setCapchaImages(createImages(capcha, selectedImages));
      setCapcha(capcha);
    })();
  }, []);

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


