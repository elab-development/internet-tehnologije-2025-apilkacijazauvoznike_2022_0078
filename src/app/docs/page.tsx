"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import openApiSpec from "@/src/lib/swagger";

export default function ApiDocsPage() {
  return (
    <div style={{ padding: "20px" }}>
      <SwaggerUI spec={openApiSpec} />
    </div>
  );
}