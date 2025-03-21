import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RemoveTag from "./component/removetag";
import TagType from "./component/tagtype";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light bg-light mb-3">
        <div className="container">
          <Link className="navbar-brand" to="/">Home</Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/">RemoveTag</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/tagtype">TagType</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="container">
        <Routes>
          <Route 
            path="/" 
            element={
              <div>
                <RemoveTag />
                <TagType />
              </div>
            } 
          />
          <Route path="/" element={<RemoveTag />} />
          <Route path="/tagtype" element={<TagType />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
