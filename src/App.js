import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RemoveTag from "./component/removetag";
import TagType from "./component/tagtype";
import Pose from "./component/pose";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
        <div className="container">
          {/* Bỏ Home nếu không cần */}
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/deploying">
                  RemoveTag
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tagtype">
                  TagType
                </Link>
              </li>
              {/* Thêm nút/link cho Pose */}
              <li className="nav-item">
                <Link className="nav-link" to="/pose">
                  Pose
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container">
        <Routes>
          {/* Khi vào "/" mặc định sẽ render RemoveTag */}
          <Route path="/" element={<RemoveTag />} />
          <Route path="/deploying" element={<RemoveTag />} />
          <Route path="/tagtype" element={<TagType />} />
          {/* Thêm route cho Pose */}
          <Route path="/pose" element={<Pose />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
