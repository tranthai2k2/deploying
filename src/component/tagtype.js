import React from 'react';
import AllTags from "./alltag";
import TypeComponent from "./typecomponent";

export default function TagType() {
  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-md-6">
          <AllTags />
        </div>
        <div className="col-md-6">
          <TypeComponent />
        </div>
      </div>
    </div>
  );
}
