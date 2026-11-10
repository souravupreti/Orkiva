
import { z } from "zod";

// Supported workflow node types
export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["trigger", "action", "condition"]),
  name: z.string().min(1),
  config: z.record(z.string(), z.unknown()).default({})
});

// Connections between workflow nodes
export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1)
});

// Complete workflow structure
export const workflowSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  triggerNodeId: z.string().min(1),
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema).default([])
}).superRefine((workflow, ctx) => {
  const nodeIds = workflow.nodes.map(node => node.id);
  const uniqueIds = new Set(nodeIds);

  // Check duplicate node IDs
  if (uniqueIds.size !== nodeIds.length) {
    ctx.addIssue({
      code: "custom",
      message: "Duplicate node IDs are not allowed",
      path: ["nodes"]
    });
  }

  // Check whether the trigger exists
  const trigger = workflow.nodes.find(
    node => node.id === workflow.triggerNodeId
  );

  if (!trigger || trigger.type !== "trigger") {
    ctx.addIssue({
      code: "custom",
      message: "Invalid triggerNodeId",
      path: ["triggerNodeId"]
    });
  }

  // Check whether every edge references existing nodes
  for (const edge of workflow.edges) {
    if (!uniqueIds.has(edge.source)) {
      ctx.addIssue({
        code: "custom",
        message: `Source node ${edge.source} does not exist`,
        path: ["edges"]
      });
    }

    if (!uniqueIds.has(edge.target)) {
      ctx.addIssue({
        code: "custom",
        message: `Target node ${edge.target} does not exist`,
        path: ["edges"]
      });
    }
  }
});
