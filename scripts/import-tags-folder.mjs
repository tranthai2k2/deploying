import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDg5tScMx3wh-DxfZanNoLf9_t95ZM-uDs",
  authDomain: "removetag-geldoru.firebaseapp.com",
  projectId: "removetag-geldoru",
  storageBucket: "removetag-geldoru.firebasestorage.app",
  messagingSenderId: "177975373588",
  appId: "1:177975373588:web:7cd9ef17f6361b9553dc01",
  measurementId: "G-0B2LMJ7HLV",
};

const SKIPPED_FILES = new Set(["combined_content.txt", "test.txt", "test2.txt"]);

const TYPE_OVERRIDES = new Map([
  ["0_cencord", "kiểm duyệt"],
  ["abs", "abs"],
  ["chest", "cỡ ngực"],
  ["dotrentoc", "hair style"],
  ["eyeswear", "glasses"],
  ["hair_color", "màu tóc"],
  ["hair_style", "kiểu tóc"],
  ["halo", "halo"],
  ["headwear", "cài tóc, đội đầu"],
  ["horns", "horns"],
  ["kiemduyet", "kiểm duyệt"],
  ["mau_mat", "màu mắt"],
  ["name", "name tên"],
  ["name_1", "name tên"],
  ["name_2", "name tên"],
  ["name2", "name tên"],
  ["name2-new", "name tên"],
  ["othoai", "ô thoại"],
  ["quanao", "Clothing"],
  ["tai", "tai"],
  ["tails", "horns"],
  ["text", "text"],
  ["trangsuc", "trang sức "],
  ["trang_tri_toc", "trang sức "],
  ["wings", "wing"],
]);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function normalizeWhitespace(value) {
  return value
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(value) {
  return normalizeWhitespace(value).toLowerCase();
}

function parseTags(content) {
  const tags = [];
  for (const rawTag of content.split(/[\r\n,]+/)) {
    const cleanedTag = normalizeWhitespace(rawTag);
    if (cleanedTag) {
      tags.push(cleanedTag);
    }
  }
  return tags;
}

function makeDeterministicId(typeName, tagName) {
  return `import_${createHash("sha1")
    .update(`${typeName}\u0000${tagName}`)
    .digest("hex")}`;
}

function resolveTypeName(baseName, knownTypes) {
  if (TYPE_OVERRIDES.has(baseName)) {
    return TYPE_OVERRIDES.get(baseName);
  }

  if (
    baseName === "tags_kushina" ||
    baseName === "name" ||
    baseName === "name_1" ||
    baseName === "name_2" ||
    baseName === "name2" ||
    baseName === "name2-new" ||
    baseName.startsWith("tags_with_parentheses_")
  ) {
    return "name tên";
  }

  const normalizedBase = normalizeKey(baseName);
  for (const typeName of knownTypes) {
    if (normalizeKey(typeName) === normalizedBase) {
      return typeName;
    }
  }

  return baseName;
}

async function loadExistingTypes() {
  const snapshot = await getDocs(collection(db, "type"));
  const existingByKey = new Map();

  for (const document of snapshot.docs) {
    const data = document.data();
    const typeName = normalizeWhitespace(data.phanloai || "");
    if (typeName) {
      existingByKey.set(normalizeKey(typeName), {
        id: document.id,
        name: data.phanloai,
        mota: data.mota || "",
      });
    }
  }

  return existingByKey;
}

async function loadExistingTagPairs() {
  const snapshot = await getDocs(collection(db, "tags"));
  const existingPairs = new Set();

  for (const document of snapshot.docs) {
    const data = document.data();
    const typeName = normalizeWhitespace(data.type || "");
    const tagName = normalizeWhitespace(data.tag || "");
    if (typeName && tagName) {
      existingPairs.add(`${normalizeKey(typeName)}\u0000${normalizeKey(tagName)}`);
    }
  }

  return existingPairs;
}

async function buildPlan(folderPath) {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const existingTypes = await loadExistingTypes();
  const existingTagPairs = await loadExistingTagPairs();

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .filter((entry) => !SKIPPED_FILES.has(entry.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const plannedTypes = new Map(existingTypes);
  const typeDocsToCreate = [];
  const tagWrites = [];
  const fileSummaries = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file.name);
    const baseName = path.basename(file.name, path.extname(file.name));
    const rawContent = await fs.readFile(filePath, "utf8");
    const typeName = resolveTypeName(baseName, [...plannedTypes.values()].map((item) => item.name));
    const tags = parseTags(rawContent);

    const seenInFile = new Set();
    let skippedDuplicateCount = 0;
    let addedCount = 0;

    const typeKey = normalizeKey(typeName);
    if (!plannedTypes.has(typeKey)) {
      typeDocsToCreate.push({
        phanloai: typeName,
        mota: "",
        sourceFile: file.name,
        importedBy: "scripts/import-tags-folder.mjs",
      });
      plannedTypes.set(typeKey, {
        id: null,
        name: typeName,
        mota: "",
      });
    }

    for (const tagName of tags) {
      const normalizedTagKey = normalizeKey(tagName);
      const pairKey = `${typeKey}\u0000${normalizedTagKey}`;

      if (!normalizedTagKey || seenInFile.has(pairKey) || existingTagPairs.has(pairKey)) {
        skippedDuplicateCount += 1;
        continue;
      }

      seenInFile.add(pairKey);
      existingTagPairs.add(pairKey);
      addedCount += 1;

      tagWrites.push({
        docId: makeDeterministicId(typeName, tagName),
        type: typeName,
        tag: tagName,
        sourceFile: file.name,
      });
    }

    fileSummaries.push({
      fileName: file.name,
      typeName,
      totalParsed: tags.length,
      addedCount,
      skippedDuplicateCount,
    });
  }

  return {
    fileSummaries,
    typeDocsToCreate,
    tagWrites,
    existingTypeCount: existingTypes.size,
  };
}

async function commitPlan(plan) {
  const typeCollection = collection(db, "type");
  for (const typeDoc of plan.typeDocsToCreate) {
    const documentRef = doc(typeCollection);
    await setDoc(documentRef, {
      phanloai: typeDoc.phanloai,
      mota: typeDoc.mota,
      sourceFile: typeDoc.sourceFile,
      importedBy: typeDoc.importedBy,
      importedAt: serverTimestamp(),
    });
  }

  const batchSize = 400;
  for (let index = 0; index < plan.tagWrites.length; index += batchSize) {
    const currentBatch = writeBatch(db);
    const slice = plan.tagWrites.slice(index, index + batchSize);

    for (const write of slice) {
      const documentRef = doc(collection(db, "tags"), write.docId);
      currentBatch.set(documentRef, {
        type: write.type,
        tag: write.tag,
        sourceFile: write.sourceFile,
        importedBy: "scripts/import-tags-folder.mjs",
        importedAt: serverTimestamp(),
      });
    }

    await currentBatch.commit();
  }
}

function printPlan(plan, folderPath, shouldApply) {
  const totalParsed = plan.fileSummaries.reduce((sum, item) => sum + item.totalParsed, 0);
  const totalAdded = plan.fileSummaries.reduce((sum, item) => sum + item.addedCount, 0);
  const totalSkipped = plan.fileSummaries.reduce(
    (sum, item) => sum + item.skippedDuplicateCount,
    0
  );

  console.log(`Folder: ${folderPath}`);
  console.log(`Mode: ${shouldApply ? "apply" : "dry-run"}`);
  console.log(`Files scanned: ${plan.fileSummaries.length}`);
  console.log(`Existing types before import: ${plan.existingTypeCount}`);
  console.log(`New type docs to create: ${plan.typeDocsToCreate.length}`);
  console.log(`Parsed tags: ${totalParsed}`);
  console.log(`New tag docs to create: ${totalAdded}`);
  console.log(`Skipped duplicates/empty entries: ${totalSkipped}`);
  console.log("");

  for (const summary of plan.fileSummaries) {
    console.log(
      `${summary.fileName} -> ${summary.typeName} | parsed=${summary.totalParsed} | added=${summary.addedCount} | skipped=${summary.skippedDuplicateCount}`
    );
  }
}

async function main() {
  const folderPath = process.argv[2];
  const shouldApply = process.argv.includes("--apply");

  if (!folderPath) {
    console.error("Usage: node scripts/import-tags-folder.mjs <folder-path> [--apply]");
    process.exit(1);
  }

  const resolvedFolderPath = path.resolve(folderPath);
  const plan = await buildPlan(resolvedFolderPath);
  printPlan(plan, resolvedFolderPath, shouldApply);

  if (!shouldApply) {
    console.log("");
    console.log("Dry-run only. Add --apply to write data to Firestore.");
    return;
  }

  await commitPlan(plan);
  console.log("");
  console.log("Import completed successfully.");

  const verifySnapshot = await getDocs(query(collection(db, "tags"), limit(5)));
  console.log(`Verification sample documents fetched: ${verifySnapshot.size}`);
}

main().catch((error) => {
  console.error("Import failed.");
  console.error(error);
  process.exit(1);
});
