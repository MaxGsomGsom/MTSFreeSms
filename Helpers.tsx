import { Capcha } from "./Models";

export function getCapchaImageBase64(capcha: Capcha, number: number): string | undefined {
  return "data:image/png;base64," + capcha.Images[number];
}

export function modifyCapchaCode(code: string): string | undefined {
  const baseTagRegEx = /var \w+=jQuery\('\.QACaptcha'\)\.parents\('form'\);/g;
  const jqueryOperationsBlock = /\w+.append.+= null;/g;
  const secretNameVarRegex = /attr\('name', \w+/g;
  const secretValueVarRegex = /\.val\(\w+/g;

  code = code.replace(baseTagRegEx, "");

  const secretNameVar = code.match(secretNameVarRegex)![1].substring(13);
  const secretValueVarArray = code.match(secretValueVarRegex);
  const secretValueVar = secretValueVarArray![1].substring(5);


  // Вычисляем имена переменных, где хранятся секреты
  const jsqueryOperations = code.match(jqueryOperationsBlock)![0];
  const jsqeryOpsLines = jsqueryOperations.split(";");
  let addLines = jsqeryOpsLines.filter(e => !/remove/.test(e));
  const removeLines = jsqeryOpsLines.filter(e => /remove/.test(e));
  for (const toRemove of removeLines) {
    const attrToRemove = toRemove.match(/\w+'|\w+"/)![0];
    const attrToRemoveRegex = new RegExp(attrToRemove.substring(0, attrToRemove.length - 1));
    addLines = addLines.filter(e => !attrToRemoveRegex.test(e));
  }

  console.log(addLines);

  code = code.replace(jqueryOperationsBlock, `return { secretName: ${secretNameVar}, secretValue: ${secretValueVar} };`);
  return code;
}
