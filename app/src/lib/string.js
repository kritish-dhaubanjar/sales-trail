import { toWords } from "number-to-words";

export function amountToWordsWithCurrency(amount) {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let words = `${toWords(integerPart)} rupees`;

  if (decimalPart > 0) {
    words += ` and ${toWords(decimalPart)} paisa`;
  }

  return words + " only";
}
