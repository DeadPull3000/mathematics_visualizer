import networkx as nx
import hashlib

def compute_wl_test(G1: nx.Graph, G2: nx.Graph) -> tuple[list, list, bool]:
    """
    Computes the 1-Weisfeiler-Lehman Isomorphism Test for two graphs G1 and G2.
    Returns the coloring steps for G1, coloring steps for G2, and a boolean indicating
    whether they are isomorphic according to the WL test.
    """
    color_map_1 = {n: "1" for n in G1.nodes()}
    color_map_2 = {n: "1" for n in G2.nodes()}
    
    hash_to_int = {}
    
    def get_int_for_hash(h_str):
        if h_str not in hash_to_int:
            hash_to_int[h_str] = len(hash_to_int)
        return hash_to_int[h_str]

    # Step 0 colors
    step0_c1 = {n: get_int_for_hash(c) for n, c in color_map_1.items()}
    step0_c2 = {n: get_int_for_hash(c) for n, c in color_map_2.items()}
    steps1 = [step0_c1]
    steps2 = [step0_c2]
    
    # Check step 0 histogram
    hist1 = {}
    for c in step0_c1.values():
        hist1[c] = hist1.get(c, 0) + 1
    hist2 = {}
    for c in step0_c2.values():
        hist2[c] = hist2.get(c, 0) + 1
        
    if hist1 != hist2:
        return steps1, steps2, False
        
    max_nodes = max(len(G1), len(G2))
    if max_nodes == 0:
        return steps1, steps2, True
        
    for _ in range(max_nodes):
        new_color_map_1 = {}
        for n in G1.nodes():
            neighbor_colors = sorted([color_map_1[nbr] for nbr in G1.neighbors(n)])
            sig = f"{color_map_1[n]}_{','.join(neighbor_colors)}"
            h = hashlib.sha256(sig.encode('utf-8')).hexdigest()
            new_color_map_1[n] = h
            
        new_color_map_2 = {}
        for n in G2.nodes():
            neighbor_colors = sorted([color_map_2[nbr] for nbr in G2.neighbors(n)])
            sig = f"{color_map_2[n]}_{','.join(neighbor_colors)}"
            h = hashlib.sha256(sig.encode('utf-8')).hexdigest()
            new_color_map_2[n] = h
            
        # Record integer colors for this step
        step_c1 = {n: get_int_for_hash(c) for n, c in new_color_map_1.items()}
        step_c2 = {n: get_int_for_hash(c) for n, c in new_color_map_2.items()}
        
        steps1.append(step_c1)
        steps2.append(step_c2)
        
        # Check histograms
        hist1 = {}
        for c in step_c1.values():
            hist1[c] = hist1.get(c, 0) + 1
        hist2 = {}
        for c in step_c2.values():
            hist2[c] = hist2.get(c, 0) + 1
            
        if hist1 != hist2:
            return steps1, steps2, False
            
        # Check for stabilization
        num_unique_prev = len(set(steps1[-2].values()))
        num_unique_curr = len(set(steps1[-1].values()))
        
        if num_unique_curr == num_unique_prev:
            break
            
        color_map_1 = new_color_map_1
        color_map_2 = new_color_map_2

    return steps1, steps2, True
