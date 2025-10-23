export function declension(num: number, words: [string, string, string]): string {
  const pluralRules = new Intl.PluralRules("ru-RU");
  const pluralForm = pluralRules.select(num);

  switch (pluralForm) {
    case "one":
      return words[0]; 
    case "few":
      return words[1]; 
    case "many":
      return words[2]; 
    default:
      return words[2]; 
  }
}
