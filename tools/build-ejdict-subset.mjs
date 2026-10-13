import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const subtitleRoot = path.join(root, "public", "English_Subtitles");
const dictionaryRoot = path.join(root, "_vendor", "EJDict", "src");
const outputDir = path.join(root, "public", "dictionaries");

const irregular = {
  am: "be", are: "be", is: "be", was: "be", were: "be", been: "be",
  has: "have", had: "have", does: "do", did: "do", done: "do",
  went: "go", gone: "go", children: "child", people: "person",
  men: "man", women: "woman", mice: "mouse", feet: "foot", teeth: "tooth"
};

function normalize(value) {
  return value.toLowerCase().replace(/[’]/g, "'").replace(/^'+|'+$/g, "");
}

function candidates(word) {
  const result = [word];
  if (irregular[word]) result.push(irregular[word]);
  if (word.endsWith("'s")) result.push(word.slice(0, -2));
  if (word.endsWith("ies") && word.length > 4) result.push(`${word.slice(0, -3)}y`);
  if (word.endsWith("ves") && word.length > 4) {
    result.push(`${word.slice(0, -3)}f`, `${word.slice(0, -3)}fe`);
  }
  if (word.endsWith("ing") && word.length > 5) {
    const stem = word.slice(0, -3);
    result.push(stem, `${stem}e`);
    if (stem.at(-1) === stem.at(-2)) result.push(stem.slice(0, -1));
  }
  if (word.endsWith("ied") && word.length > 4) result.push(`${word.slice(0, -3)}y`);
  if (word.endsWith("ed") && word.length > 4) {
    const stem = word.slice(0, -2);
    result.push(stem, `${stem}e`);
    if (stem.at(-1) === stem.at(-2)) result.push(stem.slice(0, -1));
  }
  if (word.endsWith("es") && word.length > 4) result.push(word.slice(0, -2));
  if (word.endsWith("s") && word.length > 3) result.push(word.slice(0, -1));
  return [...new Set(result)];
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const words = new Set();
for (const file of walk(subtitleRoot).filter((item) => item.endsWith(".json"))) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const segment of payload.segments ?? []) {
    for (const token of segment.text?.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []) {
      words.add(normalize(token));
    }
  }
}

const dictionary = new Map();
for (const file of fs.readdirSync(dictionaryRoot).filter((item) => item.endsWith(".txt"))) {
  for (const line of fs.readFileSync(path.join(dictionaryRoot, file), "utf8").split(/\r?\n/)) {
    const tab = line.indexOf("\t");
    if (tab < 1) continue;
    const meaning = line.slice(tab + 1).trim();
    for (const headword of line.slice(0, tab).split(",")) {
      const key = normalize(headword.trim());
      if (key && meaning && !dictionary.has(key)) dictionary.set(key, meaning);
    }
  }
}

const subset = {};
for (const word of [...words].sort()) {
  const match = candidates(word).find((candidate) => dictionary.has(candidate));
  if (match) subset[word] = dictionary.get(match);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "ejdict-subtitle.json"),
  `${JSON.stringify(subset)}\n`,
  "utf8"
);
fs.writeFileSync(
  path.join(outputDir, "EJDICT_NOTICE.txt"),
  [
    "EJDict-hand English-Japanese dictionary data",
    "Source: https://github.com/kujirahand/EJDict",
    "License: CC0 1.0 Universal / Public Domain",
    "This application includes a material-specific subset generated from EJDict."
  ].join("\n") + "\n",
  "utf8"
);

console.log(`Wrote ${Object.keys(subset).length} entries for ${words.size} observed words.`);
