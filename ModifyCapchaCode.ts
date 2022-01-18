// Copyright 2022 Russian Post
// This source code is Russian Post Confidential Proprietary.
// This software is protected by copyright. All rights and titles are reserved.
// You shall not use, copy, distribute, modify, decompile, disassemble or reverse engineer the software.
// Otherwise this violation would be treated by law and would be subject to legal prosecution.
// Legal use of the software provides receipt of a license from the right holder only.

export function modifyCapchaCode(code: string): string | undefined {
  const baseTagRegEx = /var \w+=jQuery\('\.QACaptcha'\)\.parents\('form'\);/g;
  const jqueryOperationsBlock = /\w+.append.+= null;/g;
  const secretNameVarRegex = /attr\('name', \w+/g;
  const secretValueVarRegex = /\.val\(\w+/g;

  // Вычисляем строки с именами переменных, где хранятся секреты
  const jsqueryOperations = code.match(jqueryOperationsBlock)![0];
  const jsqeryOpsLines = jsqueryOperations.split(";");

  let addLines = jsqeryOpsLines.filter(e => /append/.test(e));
  const removeLines = jsqeryOpsLines.filter(e => /remove/.test(e));
  
  for (const toRemove of removeLines) {
    const attrToRemoveType1 = toRemove.match(/\w+'/)?.[0];
    const attrToRemoveType2 = toRemove.match(/\w+"\]'/)?.[0]!;
    const attrToRemoveRegex = new RegExp(attrToRemoveType1
      ? attrToRemoveType1.substring(0, attrToRemoveType1.length - 1)
      : attrToRemoveType2.substring(0, attrToRemoveType2.length - 3));
    addLines = addLines.filter(e => !attrToRemoveRegex.test(e));
  }

  const lineWithVars = addLines[0];

  // Вытащим имена переменных
  const secretNameVar = lineWithVars.match(secretNameVarRegex)![0].substring(13);
  const secretValueVarArray = lineWithVars.match(secretValueVarRegex);
  const secretValueVar = secretValueVarArray![0].substring(5);

  code = code.replace(baseTagRegEx, "");
  code = code.replace(jqueryOperationsBlock, `return { secretName: ${secretNameVar}, secretValue: ${secretValueVar} };`);
  return code;
}