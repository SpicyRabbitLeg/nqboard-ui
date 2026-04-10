/**
 * 字符串工具类 (TypeScript 版本)
 */
export const StrUtil = {
  /** 判断字符串是否为空白 */
  isBlank(str?: string | null): boolean {
    return str === undefined || str === null || this.trim(str) === "";
  },

  /** 判断字符串是否为非空白 */
  isNotBlank(str?: string | null): boolean {
    return !this.isBlank(str);
  },

  /** 判断字符串是否为空 */
  isEmpty(str?: string | null): boolean {
    return str === null || str === "";
  },

  /** 判断字符串是否为非空 */
  isNotEmpty(str?: string | null): boolean {
    return !this.isEmpty(str);
  },

  /** 空对象转字符串 */
  nullToStr(str?: string | null): string {
    return this.isEmpty(str) ? "" : String(str);
  },

  /** 去除空格与换行符 */
  trim(str?: string | null): string {
    if (str == null) return "";
    return String(str).replace(/(^\s*)|(\s*$)|\r|\n/g, "");
  },

  /** 判断两个字符串是否相等（区分大小写） */
  equals(str: string, that: string): boolean {
    return str === that;
  },

  /** 判断两个字符串是否相等（不区分大小写） */
  equalsIgnoreCase(str: string, that: string): boolean {
    return String(str).toUpperCase() === String(that).toUpperCase();
  },

  /** 分割字符串 */
  split(str: string, sep: string, maxLen?: number): string[] | null {
    if (this.isEmpty(str)) return null;
    const value = String(str).split(sep);
    return maxLen ? value.slice(0, maxLen - 1) : value;
  },

  /** 格式化字符串（%s） */
  sprintf(str: string, ...args: any[]): string {
    let flag = true, i = 0;
    str = str.replace(/%s/g, () => {
      const arg = args[i++];
      if (typeof arg === "undefined") {
        flag = false;
        return "";
      }
      return arg;
    });
    return flag ? str : "";
  },

  /** 判断字符串是否以某个字符串开头 */
  startWith(str: string, start: string): boolean {
    return new RegExp("^" + start).test(str);
  },

  /** 判断字符串是否以某个字符串结尾 */
  endWith(str: string, end: string): boolean {
    return new RegExp(end + "$").test(str);
  },

  /** 是否包含空格 */
  containsWhitespace(input: string): boolean {
    return input.includes(" ");
  },

  /** 重复指定字符 */
  repeat(ch: string, repeatTimes: number): string {
    return ch.repeat(repeatTimes);
  },

  /** 删除所有空格 */
  deleteWhitespace(input: string): string {
    return input.replace(/\s+/g, "");
  },

  rightPad(input: string, size: number, padStr: string): string {
    return input + this.repeat(padStr, size);
  },

  leftPad(input: string, size: number, padStr: string): string {
    return this.repeat(padStr, size) + input;
  },

  /** 首字母大写 */
  capitalize(input: string): string {
    if (!input) return input;
    return input.replace(/^[a-z]/, matchStr => matchStr.toUpperCase());
  },

  /** 首字母小写 */
  uncapitalize(input: string): string {
    if (!input) return input;
    return input.replace(/^[A-Z]/, matchStr => matchStr.toLowerCase());
  },

  /** 大小写互换 */
  swapCase(input: string): string {
    return input.replace(/[a-z]/gi, matchStr => {
      return matchStr === matchStr.toUpperCase()
        ? matchStr.toLowerCase()
        : matchStr.toUpperCase();
    });
  },

  /** 统计子字符串出现次数 */
  countMatches(input: string, sub: string): number {
    if (this.isEmpty(input) || this.isEmpty(sub)) return 0;
    let count = 0;
    let index = 0;
    while ((index = input.indexOf(sub, index)) !== -1) {
      index += sub.length;
      count++;
    }
    return count;
  },

  /** 纯字母 */
  isAlpha(input: string): boolean {
    return /^[a-z]+$/i.test(input);
  },
  isAlphaSpace(input: string): boolean {
    return /^[a-z\s]*$/i.test(input);
  },
  isAlphanumeric(input: string): boolean {
    return /^[a-z0-9]+$/i.test(input);
  },
  isAlphanumericSpace(input: string): boolean {
    return /^[a-z0-9\s]*$/i.test(input);
  },
  isNumeric(input: string): boolean {
    return /^(?:[1-9]\d*|0)(?:\.\d+)?$/.test(input);
  },
  isDecimal(input: string): boolean {
    return /^[-+]?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  isNegativeDecimal(input: string): boolean {
    return /^-?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  isPositiveDecimal(input: string): boolean {
    return /^\+?(?:0|[1-9]\d*)\.\d+$/.test(input);
  },
  isInteger(input: string): boolean {
    return /^[-+]?(?:0|[1-9]\d*)$/.test(input);
  },
  isPositiveInteger(input: string): boolean {
    return /^\+?(?:0|[1-9]\d*)$/.test(input);
  },
  isNegativeInteger(input: string): boolean {
    return /^-?(?:0|[1-9]\d*)$/.test(input);
  },
  isNumericSpace(input: string): boolean {
    return /^[\d\s]*$/.test(input);
  },
  isWhitespace(input: string): boolean {
    return /^\s*$/.test(input);
  },
  isAllLowerCase(input: string): boolean {
    return /^[a-z]+$/.test(input);
  },
  isAllUpperCase(input: string): boolean {
    return /^[A-Z]+$/.test(input);
  },

  defaultString(input: string | null | undefined, defaultStr: string): string {
    return input == null ? defaultStr : input;
  },
  defaultIfBlank(input: string, defaultStr: string): string {
    return this.isBlank(input) ? defaultStr : input;
  },
  defaultIfEmpty(input: string, defaultStr: string): string {
    return this.isEmpty(input) ? defaultStr : input;
  },

  /** 字符串反转 */
  reverse(input: string): string {
    if (this.isBlank(input)) return input;
    return input.split("").reverse().join("");
  },

  /** 删除特殊字符 */
  removeSpecialCharacter(input: string): string {
    return input.replace(/[!-/:-@\[-`{-~]/g, "");
  },

  /** 是否只包含特殊字符、数字、字母 */
  isSpecialCharacterAlphanumeric(input: string): boolean {
    return /^[!-~]+$/.test(input);
  },

  /** 消息格式化 {0} */
  format(message: string, arr: string[]): string {
    return message.replace(/{(\d+)}/g, (_, group1) => arr[group1]);
  },

  /** 压缩连续字符 */
  compressRepeatedStr(input: string, ignoreCase = false): string {
    const pattern = new RegExp("([a-z])\\1+", ignoreCase ? "ig" : "g");
    return input.replace(pattern, (matchStr, group1) => matchStr.length + group1);
  },

  /** 中文校验 */
  isChinese(input: string): boolean {
    return /^[\u4E00-\u9FA5]+$/.test(input);
  },

  /** 移除中文字符 */
  removeChinese(input: string): string {
    return input.replace(/[\u4E00-\u9FA5]+/gm, "");
  },

  /** 转义单个元字符 */
  escapeMetacharacter(input: string): string {
    const metacharacter = "^$()*+.[]|\\-?{}|";
    if (metacharacter.includes(input)) {
      return "\\" + input;
    }
    return input;
  },

  /** 转义字符串中所有元字符 */
  escapeMetacharacterOfStr(input: string): string {
    return input.replace(/[\^\$\*\+\.\|\\\-\?\{\}\|]/gm, "\\$&");
  },
} as const;
