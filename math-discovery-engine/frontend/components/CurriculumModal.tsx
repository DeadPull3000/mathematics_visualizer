"use client";

import React, { useState } from "react";
import { Domain } from "@/types/domain";

export interface Scenario {
  id: string;
  title: string;
  domainId: string;
  inputType: "edge_list" | "formula" | "json";
  rawData: string;
  theory: string;
  challenge: string;
  expectedOutcome: string;
}

export interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchScenario: (domainId: string, inputType: "edge_list" | "formula" | "json", rawData: string) => void;
}

const LAB_MODULES: { id: string; title: string; category: string; description: string; scenarios: Scenario[] }[] = [
  {
    id: "homology-euler",
    title: "Lab 1: Euler Invariant & Homological Voids",
    category: "Topology & Homology",
    description: "Explore how 1D tunnels and independent cycles alter the Betti spectrum and Euler characteristic χ.",
    scenarios: [
      {
        id: "path-vs-cycle",
        title: "Experiment 1.1: Acyclic Tree vs Homological Loop",
        domainId: "topology",
        inputType: "edge_list",
        rawData: "0 1\n1 2\n2 3\n3 4",
        theory: "A tree has β₀=1, β₁=0, and Euler characteristic χ = |V| - |E| = 5 - 4 = 1.",
        challenge: "Observe β₁=0 for this path graph P₅. Next, add edge '4 0' to observe the birth of a 1-cycle generator.",
        expectedOutcome: "β₁ will jump to 1; algebraic connectivity λ₁ will increase from 0.38 to 1.38.",
      },
      {
        id: "closed-cycle",
        title: "Experiment 1.2: The Cycle Graph C₅",
        domainId: "topology",
        inputType: "edge_list",
        rawData: "0 1\n1 2\n2 3\n3 4\n4 0",
        theory: "Cycle C₅ contains an independent non-bounding 1-cycle generator in H₁(X).",
        challenge: "Verify that the Simplicial Clique Complex reports 0 filled 2-simplices (triangles) and 1 hole.",
        expectedOutcome: "β₁ = 1, triangles = 0, χ = 0.",
      },
    ],
  },
  {
    id: "spectral-bottlenecks",
    title: "Lab 2: Spectral Graph Bottlenecks & Cheeger Cuts",
    category: "Spectral Graph Theory",
    description: "Discover how the Fiedler vector and algebraic connectivity λ₁ reveal structural diffusion bottlenecks.",
    scenarios: [
      {
        id: "barbell-bottleneck",
        title: "Experiment 2.1: The Barbell Bridge Bottleneck",
        domainId: "topology",
        inputType: "edge_list",
        rawData: "0 1\n0 2\n0 3\n1 2\n1 3\n2 3\n3 4\n4 5\n5 6\n5 7\n5 8\n6 7\n6 8\n7 8",
        theory: "The Cheeger inequality λ₁/2 ≤ h(G) ≤ √(2λ₁) bounds the worst-case conductance across graph cuts.",
        challenge: "Examine the Fiedler vector coordinates: positive coordinates will cluster on one clique, negative on the other.",
        expectedOutcome: "λ₁ < 0.25 (severe spectral bottleneck); bridge edge (3,4) carries peak gradient saliency.",
      },
    ],
  },
  {
    id: "clique-triangulation",
    title: "Lab 3: Simplicial Triangulation vs Topological Holes",
    category: "Algebraic Topology",
    description: "Understand the algebraic boundary operator: why filled triangles kill 1-cycles in H₁(X).",
    scenarios: [
      {
        id: "triangulated-diamond",
        title: "Experiment 3.1: Diamond with 2-Simplices",
        domainId: "topology",
        inputType: "edge_list",
        rawData: "0 1\n1 2\n2 3\n3 0\n0 2",
        theory: "The chord (0,2) splits the 4-cycle into two triangles (0,1,2) and (0,2,3).",
        challenge: "Because both 3-cliques become 2-simplices, does β₁ equal 0 or 2?",
        expectedOutcome: "β₁ = 0 because the cycles bound 2-chains in im(∂₂); triangles = 2.",
      },
    ],
  },
  {
    id: "algebraic-singularities",
    title: "Lab 4: Singularity Loci & Nullstellensatz Certificates",
    category: "Algebraic Geometry",
    description: "Test algebraic surfaces for geometric smoothness and observe Hilbert's Nullstellensatz certificates.",
    scenarios: [
      {
        id: "smooth-sphere",
        title: "Experiment 4.1: Smooth Unit 2-Sphere",
        domainId: "algebraic-geometry",
        inputType: "formula",
        rawData: "x^2 + y^2 + z^2 - 1",
        theory: "The gradient ∇F = (2x, 2y, 2z) never vanishes on the unit sphere.",
        challenge: "Verify that the Groebner basis ⟨F, ∇F⟩ contains 1 (Hilbert Nullstellensatz certificate).",
        expectedOutcome: "Globally smooth variety; singular locus is empty V(F, ∇F) = ∅.",
      },
      {
        id: "singular-cone",
        title: "Experiment 4.2: Nodal Singularity of the Double Cone",
        domainId: "algebraic-geometry",
        inputType: "formula",
        rawData: "x^2 + y^2 - z^2",
        theory: "At the origin (0,0,0), both F and ∇F = (2x, 2y, -2z) vanish simultaneously.",
        challenge: "Observe how the engine flags the nodal singularity and failure of the Nullstellensatz certificate.",
        expectedOutcome: "Singular point detected at (0,0,0); ideal ⟨F, ∇F⟩ is proper.",
      },
    ],
  },
];

export function CurriculumModal({ isOpen, onClose, onLaunchScenario }: CurriculumModalProps) {
  const [activeTab, setActiveTab] = useState<string>("homology-euler");

  if (!isOpen) return null;

  const currentModule = LAB_MODULES.find((m) => m.id === activeTab) ?? LAB_MODULES[0];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 17, 19, 0.85)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          maxHeight: "90vh",
          background: "#1C1F21",
          border: "1px solid #D19E4A66",
          borderRadius: 14,
          boxShadow: "0 10px 40px #0F111388, 0 0 40px #D19E4A15",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #2C3133",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#16191B",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🎓</span>
            <div>
              <div
                style={{
                  color: "#D19E4A",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Curriculum Mode · Interactive Guided Laboratories
              </div>
              <div style={{ color: "#888C8E", fontSize: 11, marginTop: 2 }}>
                Step-by-step mathematical explorations, theoretical predictions & instant verification
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#2C313380",
              border: "1px solid #2C3133",
              borderRadius: 6,
              color: "#E6E4DF",
              fontSize: 14,
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Sidebar Tabs + Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Lab Modules Sidebar */}
          <div
            style={{
              width: 280,
              borderRight: "1px solid #2C3133",
              background: "#141617",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflowY: "auto",
            }}
          >
            <div style={{ color: "#888C8E", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Learning Tracks
            </div>
            {LAB_MODULES.map((m) => {
              const isSelected = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  style={{
                    background: isSelected ? "#2C3133" : "transparent",
                    border: `1px solid ${isSelected ? "#D19E4A" : "transparent"}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ color: isSelected ? "#E6E4DF" : "#888C8E", fontSize: 12, fontWeight: 700 }}>
                    {m.title}
                  </div>
                  <div style={{ color: isSelected ? "#D19E4A" : "#555A5D", fontSize: 10, marginTop: 4 }}>
                    {m.category}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module Content */}
          <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h3 style={{ color: "#E6E4DF", fontSize: 18, fontFamily: "'Georgia', serif", margin: 0 }}>
                {currentModule.title}
              </h3>
              <p style={{ color: "#888C8E", fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
                {currentModule.description}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {currentModule.scenarios.map((sc, idx) => (
                <div
                  key={sc.id}
                  style={{
                    background: "#141617",
                    border: "1px solid #2C3133",
                    borderRadius: 10,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ color: "#D19E4A", fontWeight: 700, fontSize: 13 }}>
                      {sc.title}
                    </div>
                    <span
                      style={{
                        background: "#2C3133",
                        color: "#6B8075",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 9,
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 700,
                      }}
                    >
                      {sc.domainId.toUpperCase()} · {sc.inputType}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "#E6E4DF", lineHeight: 1.5 }}>
                    <strong style={{ color: "#888C8E" }}>Theoretical Principle: </strong>
                    {sc.theory}
                  </div>

                  <div
                    style={{
                      background: "#1C1F21",
                      borderLeft: "3px solid #C05640",
                      padding: "8px 12px",
                      fontSize: 11,
                      color: "#E6E4DF",
                      lineHeight: 1.4,
                    }}
                  >
                    <strong style={{ color: "#C05640" }}>Socratic Challenge: </strong>
                    {sc.challenge}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                    <code
                      style={{
                        background: "#0F1113",
                        border: "1px solid #2C3133",
                        borderRadius: 4,
                        padding: "4px 8px",
                        fontSize: 11,
                        color: "#888C8E",
                        fontFamily: "'Courier New', monospace",
                      }}
                    >
                      {sc.rawData.replace(/\n/g, " · ")}
                    </code>

                    <button
                      onClick={() => {
                        onLaunchScenario(sc.domainId, sc.inputType, sc.rawData);
                        onClose();
                      }}
                      style={{
                        background: "linear-gradient(135deg, #D19E4A, #D19E4Aee)",
                        border: "none",
                        borderRadius: 6,
                        color: "#141617",
                        fontWeight: 700,
                        fontSize: 11,
                        letterSpacing: "0.06em",
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      🚀 LAUNCH EXPERIMENT
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
