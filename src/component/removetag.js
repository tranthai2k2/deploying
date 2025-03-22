import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaChevronDown, FaChevronRight, FaSearch } from "react-icons/fa";

export default function RemoveTag() {
  const [firebaseTags, setFirebaseTags] = useState([]);
  const [uniqueTypes, setUniqueTypes] = useState([]);
  const [tagsByType, setTagsByType] = useState({});
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [inputFormat, setInputFormat] = useState("gelbooru"); // Mặc định gelbooru
  const [searchTerm, setSearchTerm] = useState("");
  const [isTypeSectionOpen, setIsTypeSectionOpen] = useState(false);

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
    setUniqueTypes(Array.from(typesSet));
    setTagsByType(mapping);
  }, [firebaseTags]);

  // Hàm toggle cho phần hiển thị danh sách type
  const toggleTypeSection = () => {
    setIsTypeSectionOpen(!isTypeSectionOpen);
  };

  // Hàm xử lý chọn/bỏ chọn tất cả các type thông qua checkbox
  const toggleSelectAllTypes = (e) => {
    e.stopPropagation();
    if (selectedTypes.length === uniqueTypes.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes([...uniqueTypes]);
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
    return text
      .split("?")
      .map((seg) => seg.replace(/\s+\d+$/, "").trim())
      .filter((seg) => seg !== "");
  };

  // Xử lý đầu vào để chuyển thành mảng tag
  const processInputText = () => {
    return inputFormat === "gelbooru"
      ? processGelbooruInput(inputText)
      : inputText
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t.length > 0);
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
    setOutputText(inputTags.filter((t) => !tagsToRemove.has(t)).join(", "));
  };

  // Lọc các type dựa trên từ khóa tìm kiếm
  const filteredTypes = uniqueTypes.filter((type) =>
    type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tự động xử lý sau 1 giây delay khi ngừng nhập liệu
  useEffect(() => {
    const handler = setTimeout(() => {
      processTags();
    }, 1000);
    return () => clearTimeout(handler);
  }, [inputText, selectedTypes, inputFormat]);

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-center">Loại bỏ các Tag theo Type được chọn</h3>
      <div className="row">
        {/* Cột bên trái */}
        <div className="col-md-6">
          {/* Phần nhập định dạng và input tag */}
          <div className="d-flex gap-2 mb-3">
            <select
              className="form-select w-auto"
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
            >
              <option value="gelbooru">Gelbooru</option>
              <option value="default">Mặc định (dấu phẩy)</option>
            </select>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Nhập tag..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {/* Phần chọn Type với header sử dụng checkbox có viền trắng */}
          <div className="card mb-4">
            <div
              className="card-header d-flex justify-content-between align-items-center bg-primary text-white p-2"
              style={{ cursor: "pointer" }}
              onClick={toggleTypeSection}
            >
              <span style={{ fontSize: "0.9rem" }}>
                Chọn Type ({selectedTypes.length})
              </span>
              <div className="d-flex align-items-center">
                <label
                  className="d-flex align-items-center mb-0"
                  onClick={(e) => e.stopPropagation()}
                  style={{ border: "1px solid white", padding: "2px 6px", borderRadius: "4px" }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    checked={selectedTypes.length === uniqueTypes.length}
                    onChange={toggleSelectAllTypes}
                    style={{ border: "1px solid white" }}
                  />
                  <span style={{ fontSize: "0.9rem" }}>
                    {selectedTypes.length === uniqueTypes.length
                      ? "Bỏ chọn tất cả"
                      : "Chọn tất cả"}
                  </span>
                </label>
                {isTypeSectionOpen ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </div>
            {isTypeSectionOpen && (
              <div className="card-body p-3">
                {/* Ô tìm kiếm type */}
                <div className="position-relative mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Tìm kiếm type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" />
                </div>
                {/* Danh sách type */}
                <div
                  className="d-flex flex-wrap"
                  style={{ maxHeight: "150px", overflowY: "auto" }}
                >
                  {filteredTypes.map((type) => (
                    <div key={type} className="form-check me-3 mb-2">
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
            )}
          </div>

          {/* Nút xử lý */}
          <button className="btn btn-primary w-100" onClick={processTags}>
            Xử lý
          </button>
        </div>

        {/* Cột bên phải */}
        <div className="col-md-6">
          <div className="mb-4">
            <label htmlFor="outputText" className="form-label fw-bold">
              Output (sau khi loại bỏ các tag theo type được chọn)
            </label>
            <textarea
              id="outputText"
              className="form-control"
              rows="15"
              value={outputText}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
