
export function getExecutionOrder(workflow) {
  const adjacencyList = new Map();
  const indegree = new Map();

  // Initialize every node
  for (const node of workflow.nodes) {
    adjacencyList.set(node.id, []);
    indegree.set(node.id, 0);
  }

  // Build graph from edges
  for (const edge of workflow.edges) {
    adjacencyList.get(edge.source).push(edge.target);

    indegree.set(
      edge.target,
      indegree.get(edge.target) + 1
    );
  }

  // Find nodes with no dependencies
  const queue = [];

  for (const node of workflow.nodes) {
    if (indegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  }

  const executionOrder = [];

  // Process nodes using Kahn's algorithm
  while (queue.length > 0) {
    const currentNode = queue.shift();

    executionOrder.push(currentNode);

    const neighbors = adjacencyList.get(currentNode);

    for (const neighbor of neighbors) {
      indegree.set(
        neighbor,
        indegree.get(neighbor) - 1
      );

      if (indegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If some nodes remain, a cycle exists
  if (executionOrder.length !== workflow.nodes.length) {
    return {
      success: false,
      message: "Cycle detected in workflow"
    };
  }

  return {
    success: true,
    executionOrder
  };
}
