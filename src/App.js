import React from "react";
import TagComponent from "./component/tagcomponent";
import AllTags from "./component/alltag";
import TypeComponent from "./component/typecomponent";

export default function App() {
  return (
    <div>
      <AllTags></AllTags>
      <TypeComponent></TypeComponent>
    </div>
  );
}
