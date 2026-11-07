"use client";

import React, { useRef, useCallback } from "react";
import { Domain, InputMode } from "@/types/domain";

export interface DropzoneProps {
  domain: Domain;
  inputMode: InputMode;
  setInputMode: (m: InputMode) => void;
  pastedText: string;
  setPastedText: (v: string) => void;
  formulaText: string;
  setFormulaText: (v: string) => void;
  onFileLoad: (raw: string) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export function Dropzone({
  domain,
  inputMode,
  setInputMode,
  pastedText,
  setPastedText,
  formulaText,
  setFormulaText,
  onFileLoad,
  isDragging,
  setIsDragging,
}: DropzoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => onFileLoad(ev.target?.result as string);
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile, setIsDragging]
  );

  const modes: { id: InputMode; label: string }[] = [
    { id: "upload", label: "Upload JSON" },
    { id: "paste", label: "Edge List" },
    { id: "formula", label: "Formula" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        flex: 1,
        paddingBottom: 16,
      }}
    >
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #2C3133" }}>
        {modes.map((m) => (
          <button
            key={m.id}
            id={`tab-${m.id}`}
            onClick={() => setInputMode(m.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                inputMode === m.id ? `2px solid ${domain.color}` : "2px solid transparent",
              color: inputMode === m.id ? "#E6E4DF" : "#888C8E",
              cursor: "pointer",
              padding: "10px 18px",
              fontSize: 12,
              fontWeight: inputMode === m.id ? 600 : 400,
              letterSpacing: "0.04em",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Upload — FileReader stores raw JSON string */}
      {inputMode === "upload" && (
        <div
          id="dropzone-area"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            minHeight: 220,
            border: `1.5px dashed ${isDragging ? domain.color : "#2C3133"}`,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            gap: 12,
            transition: "all 0.2s ease",
            background: isDragging ? `${domain.color}08` : "transparent",
          }}
        >
          <div
            style={{
              fontSize: 36,
              opacity: isDragging ? 1 : 0.5,
              transition: "opacity 0.2s",
            }}
          >
            {domain.icon}
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                color: "#E6E4DF",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Drop your JSON file here
            </div>
            <div style={{ color: "#888C8E", fontSize: 12 }}>
              or click to browse · accepts{" "}
              <code
                style={{
                  background: "#2C3133",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 11,
                  color: domain.color,
                }}
              >
                .json
              </code>{" "}
              in NetworkX node-link format
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            id="file-input"
            accept=".json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
            }}
          />
        </div>
      )}

      {/* Paste — edge_list */}
      {inputMode === "paste" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            One edge per line, space or comma separated — e.g.{" "}
            <code style={{ color: domain.color, fontSize: 11 }}>0 1</code>
          </div>
          <textarea
            id="edge-list-input"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={"0 1\n1 2\n2 3\n3 0\n0 2"}
            style={{
              minHeight: 200,
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              color: "#E6E4DF",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 13,
              lineHeight: 1.7,
              padding: "14px 16px",
              resize: "vertical",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = domain.color;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#2C3133";
            }}
          />
        </div>
      )}

      {/* Formula */}
      {inputMode === "formula" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: "#888C8E", fontSize: 11, letterSpacing: "0.04em" }}>
            Enter a graph-theoretic formula
          </div>
          <input
            id="formula-input"
            type="text"
            value={formulaText}
            onChange={(e) => setFormulaText(e.target.value)}
            placeholder="e.g.  K_5  or  C_6  or  P_4"
            style={{
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              color: "#E6E4DF",
              fontFamily: "'Georgia', serif",
              fontSize: 20,
              padding: "16px 18px",
              outline: "none",
              transition: "border-color 0.15s",
              letterSpacing: "0.08em",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = domain.color;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#2C3133";
            }}
          />
          <div
            style={{
              background: "#111315",
              border: "1px solid #2C3133",
              borderRadius: 10,
              padding: "16px 18px",
              color: "#888C8E",
              fontSize: 11,
              lineHeight: 1.9,
            }}
          >
            <span style={{ color: domain.color, fontWeight: 600, letterSpacing: "0.04em" }}>
              Supported graph families
            </span>
            <br />
            <code style={{ color: "#E6E4DF" }}>K_n</code>      — Complete graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>K_5</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>C_n</code>      — Cycle graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>C_6</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>P_n</code>      — Path graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>P_4</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>S_n</code>      — Star graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>S_10</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>B_n_m</code>    — Barbell graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>B_5_2</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>G_n_m</code>    — 2D Grid graph &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;e.g. <code style={{ color: "#D19E4A" }}>G_3_3</code>
            <br />
            <code style={{ color: "#E6E4DF" }}>ER_n_p</code>   — Erdős–Rényi random &nbsp;e.g. <code style={{ color: "#D19E4A" }}>ER_20_0.2</code>
          </div>
        </div>
      )}
    </div>
  );
}
