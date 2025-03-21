import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase"; // Đảm bảo đường dẫn đúng với firebase.js của bạn
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

// Hàm tách chuỗi tag theo dấu phẩy
function parseTags(input) {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function AllTagsWithAddForm() {
  // --- Phần danh sách tags ---
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState(""); // Lọc theo type
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số mục mỗi trang

  useEffect(() => {
    const colRef = collection(db, "tags");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetchedTags = snapshot.docs.map((docItem) => ({
        id: docItem.id, // Lấy id của doc
        ...docItem.data(), // Lấy các field (type, tag)
      }));
      setTags(fetchedTags);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (tagId) => {
    if (window.confirm("Bạn chắc chắn muốn xóa tag này?")) {
      try {
        await deleteDoc(doc(db, "tags", tagId));
      } catch (error) {
        console.error("Lỗi xóa tag:", error);
      }
    }
  };

  const uniqueTypes = [...new Set(tags.map((item) => item.type))];

  const filteredTags = tags.filter((item) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchSearch =
      item.type.toLowerCase().includes(lowerSearch) ||
      item.tag.toLowerCase().includes(lowerSearch);
    const matchType = filterType ? item.type === filterType : true;
    return matchSearch && matchType;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTags.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // --- Phần form thêm tag ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [types, setTypes] = useState([]); // Danh sách từ collection "type"
  const [selectedType, setSelectedType] = useState(null); // Object { id, phanloai, mota }
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");
  const [tagsInput, setTagsInput] = useState(""); // Nhập nhiều tag, phân cách dấu phẩy
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const dropdownRef = useRef(null);

  // Lấy danh sách type từ collection "type"
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

  // Lọc danh sách type theo typeSearch (dựa trên phanloai và mota)
  const filteredTypes = types.filter((item) => {
    const lowerTerm = typeSearch.toLowerCase();
    return (
      item.phanloai.toLowerCase().includes(lowerTerm) ||
      (item.mota && item.mota.toLowerCase().includes(lowerTerm))
    );
  });

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedType) {
      setFormError("Vui lòng chọn Type từ dropdown!");
      return;
    }
    const tagsArray = parseTags(tagsInput);
    if (tagsArray.length === 0) {
      setFormError("Vui lòng nhập ít nhất 1 Tag!");
      return;
    }

    try {
      for (const tag of tagsArray) {
        await addDoc(collection(db, "tags"), {
          type: selectedType.phanloai,
          tag: tag,
        });
      }
      setFormSuccess("Thêm Tag thành công!");
      setTagsInput("");
      // Tùy chọn: Ẩn form sau khi thêm thành công
      setShowAddForm(false);
    } catch (err) {
      console.error("Lỗi thêm tag:", err);
      setFormError("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Tất cả Tags</h2>

      {/* Search & Filter */}
      <div className="row mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Tìm kiếm theo type hoặc tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-6">
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">-- Lọc theo Type --</option>
            {uniqueTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nút bật/tắt form thêm tag */}
      <div className="mb-3">
        <button
          className="btn btn-success"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? "Đóng form thêm Tag" : "Thêm Tag"}
        </button>
      </div>

      {/* Form thêm tag */}
      {showAddForm && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            Nhập Type và Tag Thủ Công
          </div>
          <div className="card-body">
            <form onSubmit={handleFormSubmit}>
              {/* Dropdown chọn Type */}
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
                        value={typeSearch}
                        onChange={(e) => setTypeSearch(e.target.value)}
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
                              setTypeSearch("");
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

              {formError && (
                <div className="alert alert-danger py-1">{formError}</div>
              )}
              {formSuccess && (
                <div className="alert alert-success py-1">{formSuccess}</div>
              )}

              <button type="submit" className="btn btn-primary w-100">
                Thêm Tag
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bảng hiển thị danh sách Tags */}
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Type</th>
              <th>Tag</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.type}</td>
                  <td>{item.tag}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Không có kết quả nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className="d-flex justify-content-between align-items-center">
        <button
          className="btn btn-secondary"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span>
          Trang {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Next
        </button>
      </div>
    </div>
  );
}
