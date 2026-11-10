
import { workflowSchema } from "./index.js";

// Valid workflow
const validWorkflow = {
  schemaVersion: 1,
  name: "Daily Weather Alert",
  description: "Check weather every morning",
  triggerNodeId: "trigger_1",

  nodes: [
    {
      id: "trigger_1",
      type: "trigger",
      name: "Daily Schedule",
      config: {
        schedule: "0 9 * * *"
      }
    },
    {
      id: "action_1",
      type: "action",
      name: "Check Weather",
      config: {
        city: "Delhi"
      }
    }
  ],

  edges: [
    {
      id: "edge_1",
      source: "trigger_1",
      target: "action_1"
    }
  ]
};

// Helper function to run tests
function runTest(testName, workflow, shouldPass) {
  const result = workflowSchema.safeParse(workflow);

  const passed = result.success === shouldPass;

  console.log(
    `${passed ? "PASS" : "FAIL"} - ${testName}`
  );

  if (!passed) {
    console.log(result.success
      ? "Expected validation to fail, but it passed."
      : result.error.issues
    );
  }
}

console.log("\n===== WORKFLOW VALIDATION TESTS =====\n");

// Test 1: Valid workflow
runTest("Valid workflow", validWorkflow, true);

// Test 2: Duplicate node IDs
const duplicateNodeIds = {
  ...validWorkflow,
  nodes: [
    ...validWorkflow.nodes,
    {
      id: "trigger_1",
      type: "action",
      name: "Duplicate Node",
      config: {}
    }
  ]
};

runTest("Duplicate node IDs", duplicateNodeIds, false);

// Test 3: Edge source does not exist
const invalidSource = {
  ...validWorkflow,
  edges: [
    {
      id: "edge_1",
      source: "unknown_node",
      target: "action_1"
    }
  ]
};

runTest("Edge source does not exist", invalidSource, false);

// Test 4: Edge target does not exist
const invalidTarget = {
  ...validWorkflow,
  edges: [
    {
      id: "edge_1",
      source: "trigger_1",
      target: "unknown_node"
    }
  ]
};

runTest("Edge target does not exist", invalidTarget, false);

// Test 5: Trigger ID points to an action
const invalidTrigger = {
  ...validWorkflow,
  triggerNodeId: "action_1"
};

runTest("Trigger ID points to an action", invalidTrigger, false);

// Test 6: Trigger ID does not exist
const missingTrigger = {
  ...validWorkflow,
  triggerNodeId: "unknown_trigger"
};

runTest("Trigger ID does not exist", missingTrigger, false);

// Test 7: Invalid node type
const invalidNodeType = {
  ...validWorkflow,
  nodes: [
    ...validWorkflow.nodes,
    {
      id: "node_3",
      type: "unknown",
      name: "Unknown Node",
      config: {}
    }
  ]
};

runTest("Invalid node type", invalidNodeType, false);

// Test 8: Empty workflow name
const emptyName = {
  ...validWorkflow,
  name: ""
};

runTest("Empty workflow name", emptyName, false);

// Test 9: No nodes
const noNodes = {
  ...validWorkflow,
  nodes: []
};

runTest("Workflow without nodes", noNodes, false);

// Test 10: Missing schema version
const missingVersion = {
  ...validWorkflow
};

delete missingVersion.schemaVersion;

runTest("Missing schema version", missingVersion, false);

console.log("\n===== TESTING COMPLETED =====\n");
