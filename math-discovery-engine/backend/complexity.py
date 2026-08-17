import ast
import networkx as nx
import uuid

def parse_boolean_circuit(formula: str) -> dict:
    """
    Parses a boolean logic formula into a DAG representing a Boolean Circuit.
    Computes the circuit depth (longest path) and assigns saliency (critical path).
    """
    try:
        tree = ast.parse(formula, mode='eval')
    except SyntaxError as e:
        raise ValueError(f"Invalid boolean formula syntax: {e}")

    G = nx.DiGraph()
    
    def add_node(gate_type: str, label_hint: str = None) -> str:
        if gate_type == "VAR" and label_hint:
            node_id = label_hint
        else:
            node_id = f"{gate_type}_{uuid.uuid4().hex[:8]}"
            
        if node_id not in G:
            G.add_node(node_id, gate_type=gate_type)
        return node_id

    def traverse(node) -> str:
        if isinstance(node, ast.Name):
            return add_node("VAR", node.id)
            
        elif isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                gate_type = "AND"
            elif isinstance(node.op, ast.Or):
                gate_type = "OR"
            else:
                raise ValueError(f"Unsupported BoolOp: {type(node.op)}")
                
            gate_id = add_node(gate_type)
            for value in node.values:
                child_id = traverse(value)
                G.add_edge(child_id, gate_id)
            return gate_id
            
        elif isinstance(node, ast.BinOp):
            if isinstance(node.op, ast.BitAnd):
                gate_type = "AND"
            elif isinstance(node.op, ast.BitOr):
                gate_type = "OR"
            elif isinstance(node.op, ast.BitXor):
                gate_type = "XOR"
            else:
                raise ValueError(f"Unsupported BinOp: {type(node.op)}")
                
            gate_id = add_node(gate_type)
            left_id = traverse(node.left)
            right_id = traverse(node.right)
            G.add_edge(left_id, gate_id)
            G.add_edge(right_id, gate_id)
            return gate_id
            
        elif isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.Invert) or isinstance(node.op, ast.Not):
                gate_type = "NOT"
            else:
                raise ValueError(f"Unsupported UnaryOp: {type(node.op)}")
                
            gate_id = add_node(gate_type)
            child_id = traverse(node.operand)
            G.add_edge(child_id, gate_id)
            return gate_id
            
        else:
            raise ValueError(f"Unsupported AST node: {type(node)}")

    # Build the DAG
    root_id = traverse(tree.body)

    # Calculate invariants
    gate_nodes = [n for n, d in G.nodes(data=True) if d['gate_type'] != 'VAR']
    var_nodes = [n for n, d in G.nodes(data=True) if d['gate_type'] == 'VAR']
    
    num_gates = len(gate_nodes)
    num_vars = len(var_nodes)
    
    if not nx.is_directed_acyclic_graph(G):
        raise ValueError("Parsed circuit is not a DAG")
        
    try:
        critical_path = nx.dag_longest_path(G)
        depth = len(critical_path) - 1 if critical_path else 0
    except Exception:
        critical_path = []
        depth = 0

    saliency_scores = {}
    for n in G.nodes():
        if n in critical_path:
            saliency_scores[n] = 1.0
        else:
            saliency_scores[n] = 0.2

    # Format nodes and edges for response
    response_nodes = [{"id": str(n), "gate_type": d["gate_type"]} for n, d in G.nodes(data=True)]
    response_edges = [[str(u), str(v)] for u, v in G.edges()]

    return {
        "nodes": response_nodes,
        "edges": response_edges,
        "invariants": {
            "depth": depth,
            "num_gates": num_gates,
            "num_vars": num_vars
        },
        "saliency_scores": saliency_scores
    }
