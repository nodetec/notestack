"use client";

import { Fragment } from "react";
import Editor from "../Editor";

const WritePage = () => {
  return (
    <Fragment>
      <div style={{ height: "90vh" }}>
        <div className="h-full">
          <Editor></Editor>
        </div>
      </div>
    </Fragment>
  );
};

export default WritePage;
