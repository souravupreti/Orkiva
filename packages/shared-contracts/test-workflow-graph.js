
import {
  workflowSchema,
  getExecutionOrder
} from "./index.js";

const baseWorkflow = {
  schemaVersion: 1,
  name: "Order Processing",
  triggerNodeId: "A",

  nodes: [
    { id: "A", type: "trigger", name: "Receive Order", config: {} },
    { id: "B", type: "action", name: "Verify Payment", config: {} },
    { id: "C", type: "action", name: "Generate Invoice", config: {} },
    { id: "D", type: "action", name: "Send Email", config: {} }
  ],

  edges: [
    { id: "e1", source: "A", target: "B" },
    { id: "e2", source: "B", target: "C" },
    { id: "e3", source: "C", target: "D" }
  ]
};

function runTest(name, workflow, expectedSuccess) {
  const validation = workflowSchema.safeParse(workflow);

  if (!validation.success) {
    console.log(`FAIL - ${name}: Invalid workflow structure`);
    console.log(validation.error.issues);
    return;
  }

  const result = getExecutionOrder(validation.data);

  const passed = result.success === expectedSuccess;

  console.log(`${passed ? "PASS" : "FAIL"} - ${name}`);

  if (result.success) {
    console.log("Execution order:", result.executionOrder.join(" -> "));
  } else {
    console.log(result.message);
  }
}

// Test 1: Simple linear workflow
runTest("Linear workflow", baseWorkflow, true);

// Test 2: Branching workflow
const branchingWorkflow = {
  ...baseWorkflow,
  edges: [
    { id: "e1", source: "A", target: "B" },
    { id: "e2", source: "A", target: "C" },
    { id: "e3", source: "B", target: "D" },
    { id: "e4", source: "C", target: "D" }
  ]
};

runTest("Branching workflow", branchingWorkflow, true);

// Test 3: Circular workflow
const circularWorkflow = {
  ...baseWorkflow,
  edges: [
    { id: "e1", source: "A", target: "B" },
    { id: "e2", source: "B", target: "C" },
    { id: "e3", source: "C", target: "A" },
    { id: "e4", source: "C", target: "D" }
  ]
};

runTest("Circular workflow", circularWorkflow, false);

// Test 4: Self connection
const selfConnection = {
  ...baseWorkflow,
  edges: [
    { id: "e1", source: "A", target: "A" }
  ]
};

runTest("Self connection", selfConnection, false);

console.log("\n===== DAG TESTING COMPLETED =====");
