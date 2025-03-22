import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RemoveTag() {
  const [firebaseTags, setFirebaseTags] = useState([]);
  const [uniqueTypes, setUniqueTypes] = useState([]);
  const [tagsByType, setTagsByType] = useState({});
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [inputFormat, setInputFormat] = useState("gelbooru"); // Mặc định gelbooru

  // Lấy dữ liệu từ Firebase
  useEffect(() => {
    const colRef = collection(db, "tags");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      setFirebaseTags(data);
    });
    return () => unsubscribe();
  }, []);

  // Tính toán unique types và mapping type -> tags
  useEffect(() => {
    const typesSet = new Set();
    const mapping = {};
    firebaseTags.forEach((doc) => {
      if (doc.type && doc.tag) {
        const typeLower = doc.type.toLowerCase();
        const tagLower = doc.tag.toLowerCase();
        typesSet.add(typeLower);
        if (mapping[typeLower]) {
          if (!mapping[typeLower].includes(tagLower)) {
            mapping[typeLower].push(tagLower);
          }
        } else {
          mapping[typeLower] = [tagLower];
        }
      }
    });
    const typesArr = Array.from(typesSet);
    setUniqueTypes(typesArr);
    setTagsByType(mapping);
  }, [firebaseTags]);

  // Theo dõi selectedTypes để cập nhật selectAll
  useEffect(() => {
    if (uniqueTypes.length > 0 && selectedTypes.length === uniqueTypes.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedTypes, uniqueTypes]);

  // Xử lý checkbox "Chọn tất cả"
  const handleSelectAllChange = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedTypes([...uniqueTypes]);
    } else {
      setSelectedTypes([]);
    }
  };

  // Xử lý thay đổi từng checkbox type
  const handleTypeCheckboxChange = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Hàm xử lý đầu vào theo định dạng Gelbooru
  const processGelbooruInput = (text) => {
    // Tách theo ký tự '?' và loại bỏ phần rỗng
    const segments = text.split("?").map(seg => seg.trim()).filter(seg => seg !== "");
    // Mỗi segment có dạng: tag + số (vd: "1girl 7511694"), loại bỏ phần số ở cuối
    const tags = segments.map(seg => seg.replace(/\s+\d+$/, "").trim());
    return tags;
  };

  // Xử lý đầu vào để chuyển thành mảng tag dựa theo định dạng đã chọn
  const processInputText = () => {
    if (inputFormat === "gelbooru") {
      return processGelbooruInput(inputText);
    } else {
      // Mặc định: tách theo dấu phẩy
      return inputText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
    }
  };

  // Xử lý input để loại bỏ tag theo type đã chọn
  const processTags = () => {
    const inputTags = processInputText();
    let tagsToRemove = new Set();
    selectedTypes.forEach((type) => {
      if (tagsByType[type]) {
        tagsByType[type].forEach((t) => tagsToRemove.add(t));
      }
    });
    const filtered = inputTags.filter((t) => !tagsToRemove.has(t));
    setOutputText(filtered.join(", "));
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-center">Loại bỏ các Tag theo Type được chọn</h3>

      {/* Dropdown chọn định dạng đầu vào */}
      <div className="mb-4">
        <label htmlFor="inputFormat" className="form-label fw-bold">
          Chọn định dạng đầu vào
        </label>
        <select
          id="inputFormat"
          className="form-select"
          value={inputFormat}
          onChange={(e) => setInputFormat(e.target.value)}
        >
          <option value="gelbooru">Gelbooru</option>
          <option value="default">Mặc định (phân cách bằng dấu phẩy)</option>
        </select>
      </div>

      {/* Checkbox cho các type */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          Chọn các Type để loại bỏ Tag
        </div>
        <div className="card-body">
          <div className="form-check mb-3">
            <input
              type="checkbox"
              id="selectAll"
              className="form-check-input"
              checked={selectAll}
              onChange={handleSelectAllChange}
            />
            <label htmlFor="selectAll" className="form-check-label fw-bold">
              Chọn tất cả
            </label>
          </div>
          <div className="d-flex flex-wrap">
            {uniqueTypes.map((type) => (
              <div key={type} className="form-check me-4 mb-2">
                <input
                  type="checkbox"
                  id={type}
                  className="form-check-input"
                  checked={selectedTypes.includes(type)}
                  onChange={() => handleTypeCheckboxChange(type)}
                />
                <label htmlFor={type} className="form-check-label">
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input textarea */}
      <div className="mb-4">
        <label htmlFor="inputText" className="form-label fw-bold">
          Input (danh sách tag)
        </label>
        <textarea
          id="inputText"
          className="form-control"
          rows="5"
          placeholder='Ví dụ cho định dạng Gelbooru: ? 1girl 7511694? blue ribbon 74058? breasts 4786372? brown hair 1888683?...'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      {/* Nút Process */}
      <div className="text-center mb-4">
        <button className="btn btn-primary btn-lg" onClick={processTags}>
          Xử lý
        </button>
      </div>

      {/* Output textarea */}
      <div className="mb-4">
        <label htmlFor="outputText" className="form-label fw-bold">
          Output (sau khi loại bỏ các tag theo type được chọn)
        </label>
        <textarea
          id="outputText"
          className="form-control"
          rows="5"
          value={outputText}
          readOnly
        />
      </div>
    </div>
  );
}
