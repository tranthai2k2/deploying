import { parseTagInput } from "./removetag";

test("Danbooru: ? riêng dòng, count dạng 8.3M / 609k / 386", () => {
  const input = `?
1girl 8.3M
?
choker 609k
?
hand on own cheek 36k
?
kokoshnik 386
?
star (symbol) 354k`;
  expect(parseTagInput(input)).toEqual([
    "1girl",
    "choker",
    "hand on own cheek",
    "kokoshnik",
    "star (symbol)",
  ]);
});

test("Gelbooru: count là số nguyên", () => {
  expect(parseTagInput("? 1girl 8300000\n? blue eyes 2400000\n")).toEqual([
    "1girl",
    "blue eyes",
  ]);
});

test("Danh sách thường: không cắt số ở cuối tag", () => {
  expect(parseTagInput("1girl, gundam 00, blue eyes")).toEqual([
    "1girl",
    "gundam 00",
    "blue eyes",
  ]);
});
