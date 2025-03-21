import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import "bootstrap/dist/css/bootstrap.min.css";

export default function TypeComponent() {
  const [types, setTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [newTags, setNewTags] = useState("");
  const [editing, setEditing] = useState({ docId: null, field: "", value: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  // Lấy dữ liệu từ collection "type"
  useEffect(() => {
    const colRef = collection(db, "type");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      setTypes(
        snapshot.docs.map((doc) => ({ docId: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  // Lọc dữ liệu theo search (so sánh với phanloai và mota)
  const filteredTypes = types.filter((item) => {
    const lowerSearch = search.toLowerCase();
    return (
      item.phanloai.toLowerCase().includes(lowerSearch) ||
      (item.mota && item.mota.toLowerCase().includes(lowerSearch))
    );
  });

  // Thêm mới document vào collection "type"
  const handleAdd = async () => {
    if (!selectedType.trim() || !newTags.trim()) return;
    try {
      await addDoc(collection(db, "type"), {
        phanloai: selectedType,
        mota: newTags,
      });
      setSelectedType("");
      setNewTags("");
      // Ẩn form sau khi thêm thành công (nếu cần)
      setShowAddForm(false);
    } catch (error) {
      console.error("Lỗi thêm document:", error);
    }
  };

  // Xóa document
  const handleDelete = async (docId) => {
    try {
      await deleteDoc(doc(db, "type", docId));
    } catch (error) {
      console.error("Lỗi xóa document:", error);
    }
  };

  // Cho phép sửa inline khi double click
  const handleDoubleClick = (docId, field, value) => {
    setEditing({ docId, field, value });
  };

  const handleChange = (e) => {
    setEditing((prev) => ({ ...prev, value: e.target.value }));
  };

  const saveChanges = async () => {
    const { docId, field, value } = editing;
    if (!docId || !field) return;
    try {
      await updateDoc(doc(db, "type", docId), { [field]: value });
    } catch (error) {
      console.error("Lỗi cập nhật document:", error);
    } finally {
      setEditing({ docId: null, field: "", value: "" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") saveChanges();
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Quản lý Tags</h2>

      {/* Search Input */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Tìm kiếm theo phân loại hoặc mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Nút bật/tắt form thêm mới */}
      <div className="mb-3">
        <button
          className="btn btn-success"
          onClick={() => setShowAddForm((prev) => !prev)}
        >
          {showAddForm ? "Đóng form thêm mới" : "Hiện form thêm mới"}
        </button>
      </div>

      {/* Form thêm mới (hiển thị theo toggle) */}
      {showAddForm && (
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-primary text-white">
            Thêm mới
          </div>
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Phân loại"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Mô tả"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" onClick={handleAdd}>
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bảng hiển thị dữ liệu */}
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-light">
            <tr>
              <th>Phân loại</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.length > 0 ? (
              filteredTypes.map((item) => (
                <tr key={item.docId}>
                  {["phanloai", "mota"].map((field) => (
                    <td
                      key={field}
                      onDoubleClick={() =>
                        handleDoubleClick(item.docId, field, item[field])
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {editing.docId === item.docId &&
                      editing.field === field ? (
                        <input
                          type="text"
                          className="form-control"
                          autoFocus
                          value={editing.value}
                          onChange={handleChange}
                          onBlur={saveChanges}
                          onKeyDown={handleKeyDown}
                        />
                      ) : (
                        item[field]
                      )}
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.docId)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Không tìm thấy dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
