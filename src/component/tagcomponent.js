import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

// Hàm tách chuỗi tag theo dấu phẩy
function parseTags(input) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function TagManualWithDropdown() {
  const [types, setTypes] = useState([]); // Danh sách từ collection "/type"
  const [selectedType, setSelectedType] = useState(null); // Object chứa { id, phanloai, mota }
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagsInput, setTagsInput] = useState(""); // Text nhập nhiều tag cùng lúc
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dropdownRef = useRef(null);

  // Lấy danh sách type từ collection "/type"
  useEffect(() => {
    const colRef = collection(db, "type");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetchedTypes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(), // bao gồm: phanloai, mota
      }));
      setTypes(fetchedTypes);
    });
    return () => unsubscribe();
  }, []);

  // Lọc danh sách types theo searchTerm (dựa trên phanloai và mota)
  const filteredTypes = types.filter((item) => {
    const lowerTerm = searchTerm.toLowerCase();
    return (
      item.phanloai.toLowerCase().includes(lowerTerm) ||
      (item.mota && item.mota.toLowerCase().includes(lowerTerm))
    );
  });

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedType) {
      setError("Vui lòng chọn Type từ dropdown!");
      return;
    }
    const tagsArray = parseTags(tagsInput);
    if (tagsArray.length === 0) {
      setError("Vui lòng nhập ít nhất 1 Tag!");
      return;
    }

    try {
      // Lặp qua mảng các tag và lưu từng tag vào collection "tags"
      for (const tag of tagsArray) {
        await addDoc(collection(db, "tags"), {
          type: selectedType.phanloai,
          tag: tag,
        });
      }
      setSuccess("Thêm Tag thành công!");
      setTagsInput("");
    } catch (err) {
      console.error("Lỗi thêm tag:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Nhập Type và Tag Thủ Công</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Dropdown chọn Type với ô tìm kiếm bên trong */}
            <div className="mb-3" ref={dropdownRef}>
              <label className="form-label">Chọn Type</label>
              <div className="dropdown">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 text-start"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedType ? selectedType.phanloai : "Chọn Type"}
                </button>
                {dropdownOpen && (
                  <div
                    className="dropdown-menu w-100 p-2"
                    style={{
                      display: "block",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Tìm kiếm type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {filteredTypes.length > 0 ? (
                      filteredTypes.map((item) => (
                        <button
                          type="button"
                          className="dropdown-item"
                          key={item.id}
                          onClick={() => {
                            setSelectedType(item);
                            setDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          {item.phanloai} {item.mota ? `- ${item.mota}` : ""}
                        </button>
                      ))
                    ) : (
                      <span className="dropdown-item-text">
                        Không tìm thấy kết quả
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Nhập Tag (nhiều tag, phân cách bởi dấu phẩy) */}
            <div className="mb-3">
              <label htmlFor="tagsInput" className="form-label">
                Tag (nhập nhiều tag, phân cách bằng dấu phẩy)
              </label>
              <textarea
                className="form-control"
                id="tagsInput"
                rows="3"
                placeholder="Ví dụ: broken halo, glitched halo, crescent halo, ..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              ></textarea>
            </div>

            {error && <div className="alert alert-danger py-1">{error}</div>}
            {success && (
              <div className="alert alert-success py-1">{success}</div>
            )}

            <button type="submit" className="btn btn-primary w-100">
              Thêm Tag
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
