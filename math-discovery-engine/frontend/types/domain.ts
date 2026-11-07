import { InputType } from "@/lib/api";

export type Domain = {
  id: string;
  label: string;
  subtitle: string;
  icon: string;
  defaultInputType: InputType;
  defaultRawData: string;
  color: string;
};

export type InputMode = "upload" | "paste" | "formula";

export const DOMAINS: Domain[] = [
  {
    id: "topology",
    label: "Topology",
    subtitle: "Surfaces & Manifolds",
    icon: "◎",
    defaultInputType: "edge_list",
    defaultRawData: "0 1\n1 2\n2 3\n3 0\n4 5\n5 6\n6 7\n7 4\n0 4\n1 5\n2 6\n3 7",
    color: "#6B8075",
  },
  {
    id: "combinatorics",
    label: "Combinatorics",
    subtitle: "Graphs & Networks",
    icon: "⬡",
    defaultInputType: "edge_list",
    defaultRawData: "0 1\n1 2\n2 3\n3 4\n4 0\n0 2",
    color: "#D19E4A",
  },
  {
    id: "knot",
    label: "Knot Theory",
    subtitle: "Links & Tangles",
    icon: "∞",
    defaultInputType: "formula",
    defaultRawData: "C_6",
    color: "#C05640",
  },
  {
    id: "circuit",
    label: "Complexity Theory",
    subtitle: "Boolean Circuits",
    icon: "⊕",
    defaultInputType: "formula",
    defaultRawData: "(x1 & x2) | (~x3 & x4)",
    color: "#C05640",
  },
  {
    id: "algebraic-geometry",
    label: "Algebraic Geometry",
    subtitle: "Varieties & Schemes",
    icon: "∿",
    defaultInputType: "formula",
    defaultRawData: "x**2 + y**2 - z**2",
    color: "#D19E4A",
  },
  {
    id: "batch-explorer",
    label: "Batch Explorer",
    subtitle: "Statistical Trends",
    icon: "⋯",
    defaultInputType: "formula",
    defaultRawData: "",
    color: "#6B8075",
  },
  {
    id: "tda",
    label: "Topological Data Analysis",
    subtitle: "Persistent Homology",
    icon: "⧖",
    defaultInputType: "formula",
    defaultRawData: "noisy_circle",
    color: "#C05640",
  },
  {
    id: "wl_test",
    label: "Graph Isomorphism (WL Test)",
    subtitle: "The Twin Test",
    icon: "⋍",
    defaultInputType: "formula",
    defaultRawData: "",
    color: "#D19E4A",
  },
];
