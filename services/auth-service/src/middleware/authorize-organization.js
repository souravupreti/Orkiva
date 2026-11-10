
import { prisma } from "../lib/prisma.js";

export const authorizeOrganization = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "Organization ID is required"
        });
      }

      const membership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId
          }
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this organization"
        });
      }

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action"
        });
      }

      req.membership = membership;

      next();
    } catch (error) {
      next(error);
    }
  };
};
