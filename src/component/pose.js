import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import './Pose.css';

export default function Pose() {
  // Firestore data
  const [poseData, setPoseData] = useState([]);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Form Mode: either 'add', 'edit', or null
  const [formMode, setFormMode] = useState(null);

  // ID of the document being edited (if formMode === 'edit')
  const [editingId, setEditingId] = useState(null);

  // Fields for the ADD form
  const [addFields, setAddFields] = useState({
    url: '',
    mo_ta: '',
    prompts: '',
    type: '',
  });

  // Fields for the EDIT form
  const [editFields, setEditFields] = useState({
    url: '',
    mo_ta: '',
    prompts: '',
    type: '',
  });

  // Fetch data from Firestore on mount
  useEffect(() => {
    const colRef = collection(db, 'pose');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPoseData(data);
    });
    return () => unsubscribe();
  }, []);

  // -- CRUD Handlers --

  // 1. Add new pose
  const handleAddPose = async () => {
    if (!addFields.url.trim()) {
      return alert('URL is required');
    }
    try {
      await addDoc(collection(db, 'pose'), {
        url: addFields.url.trim(),
        mo_ta: addFields.mo_ta.trim(),
        prompts: addFields.prompts.trim(),
        type: addFields.type.trim(),
      });
      // Reset and close form
      setAddFields({ url: '', mo_ta: '', prompts: '', type: '' });
      setFormMode(null);
    } catch (error) {
      console.error('Error adding document:', error);
    }
  };

  // 2. Delete a pose
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'pose', id));
  };

  // 3. Edit: open the edit form for a given document
  const handleEditOpen = (item) => {
    setFormMode('edit');
    setEditingId(item.id);
    setEditFields({
      url: item.url || '',
      mo_ta: item.mo_ta || '',
      prompts: item.prompts || '',
      type: item.type || '',
    });
  };

  // 4. Save changes when editing
  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'pose', editingId), {
        url: editFields.url.trim(),
        mo_ta: editFields.mo_ta.trim(),
        prompts: editFields.prompts.trim(),
        type: editFields.type.trim(),
      });
      // Reset and close form
      setEditingId(null);
      setFormMode(null);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  // 5. Cancel or close any form
  const handleCloseForm = () => {
    setFormMode(null);
    setEditingId(null);
    // Optionally reset fields
    setAddFields({ url: '', mo_ta: '', prompts: '', type: '' });
    setEditFields({ url: '', mo_ta: '', prompts: '', type: '' });
  };

  // Function to copy text to clipboard (triggered khi nhấn nút Copy)
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied!'))
      .catch((err) => console.error('Error copying text: ', err));
  };

  // -- Filtering Data by searchTerm --
  const filteredPoseData = poseData.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.mo_ta?.toLowerCase().includes(search) ||
      item.prompts?.toLowerCase().includes(search) ||
      item.type?.toLowerCase().includes(search)
    );
  });

  // Determine if a form is open
  const isFormOpen = formMode !== null;

  return (
    <div className="container my-4">
      {/* Full-width Search and Add Button */}
      <div className="mb-3 d-flex align-items-center" style={{ width: '100%' }}>
        <input
          type="text"
          placeholder="Search..."
          className="form-control me-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            // Open the ADD form
            setFormMode('add');
            setEditingId(null);
          }}
        >
          Add New Pose
        </button>
      </div>

      {/* FLEX CONTAINER for 80/20 split */}
      <div style={{ display: 'flex' }}>
        {/* LEFT CONTENT (CARDS) */}
        <div
          className="left-content"
          style={{
            width: isFormOpen ? '80%' : '100%',
            transition: 'width 0.3s',
          }}
        >
          <div className="cards-container">
            {filteredPoseData.map((item) => (
              <div key={item.id} className="card">
                <img src={item.url} className="card-img-top" alt="Pose" />

                <div className="card-body">
                  <h5 className="card-title">mo_ta: {item.mo_ta}</h5>
                  <div className="card-text">
                    <strong>prompts:</strong>{' '}
                    {item.prompts.length > 100
                      ? item.prompts.slice(0, 100) + '...'
                      : item.prompts}
                    <button
                      className="btn btn-sm btn-outline-secondary ms-2"
                      onClick={() => handleCopy(item.prompts)}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="card-text">type: {item.type}</p>
                </div>

                <div className="card-footer text-end">
                  <button
                    className="btn btn-danger me-2"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEditOpen(item)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT (FORM PANEL) */}
        {isFormOpen && (
          <div
            className="right-content"
            style={{
              width: '20%',
              transition: 'width 0.3s',
              marginLeft: '1rem',
            }}
          >
            {/* ADD Form */}
            {formMode === 'add' && (
              <div>
                <h4>Add New Pose</h4>
                <div className="mb-2">
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addFields.url}
                    onChange={(e) =>
                      setAddFields({ ...addFields, url: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">mo_ta</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addFields.mo_ta}
                    onChange={(e) =>
                      setAddFields({ ...addFields, mo_ta: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">prompts</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addFields.prompts}
                    onChange={(e) =>
                      setAddFields({ ...addFields, prompts: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addFields.type}
                    onChange={(e) =>
                      setAddFields({ ...addFields, type: e.target.value })
                    }
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-secondary me-2" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={handleAddPose}>
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* EDIT Form */}
            {formMode === 'edit' && (
              <div>
                <h4>Edit Pose</h4>
                <div className="mb-2">
                  <label className="form-label">URL</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFields.url}
                    onChange={(e) =>
                      setEditFields({ ...editFields, url: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">mo_ta</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFields.mo_ta}
                    onChange={(e) =>
                      setEditFields({ ...editFields, mo_ta: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">prompts</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFields.prompts}
                    onChange={(e) =>
                      setEditFields({ ...editFields, prompts: e.target.value })
                    }
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editFields.type}
                    onChange={(e) =>
                      setEditFields({ ...editFields, type: e.target.value })
                    }
                  />
                </div>
                <div className="d-flex justify-content-end">
                  <button className="btn btn-secondary me-2" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={handleSaveEdit}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
