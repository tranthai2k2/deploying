import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Import file cấu hình Firestore
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";

export default function AllTags() {
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

  // Xử lý xóa tag
  const handleDelete = async (tagId) => {
    if (window.confirm("Bạn chắc chắn muốn xóa tag này?")) {
      try {
        await deleteDoc(doc(db, "tags", tagId));
        // Có thể thêm thông báo thành công tại đây nếu cần
      } catch (error) {
        console.error("Lỗi xóa tag:", error);
      }
    }
  };

  // Tạo danh sách các loại duy nhất để lọc
  const uniqueTypes = [...new Set(tags.map((item) => item.type))];

  // Lọc theo searchTerm và filterType
  const filteredTags = tags.filter((item) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchSearch =
      item.type.toLowerCase().includes(lowerSearch) ||
      item.tag.toLowerCase().includes(lowerSearch);
    const matchType = filterType ? item.type === filterType : true;
    return matchSearch && matchType;
  });

  // Tính toán phân trang
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

  // Khi search hoặc lọc thay đổi, reset về trang 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  return (
    <div className="container mt-4">
      <h2>Tất cả Tags</h2>

      {/* Search và Filter */}
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

      {/* Bảng hiển thị dữ liệu */}
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
