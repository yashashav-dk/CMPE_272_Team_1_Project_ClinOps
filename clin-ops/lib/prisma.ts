import { PrismaClient } from "@prisma/client";
import { incPrismaQuery, startPrismaTimer } from "@/lib/metrics";

// Define the global type for the Prisma client
declare global {
  var prisma: PrismaClient | undefined;
  var __prisma_metrics_mw_added: boolean | undefined;
}

const prisma = global.prisma || new PrismaClient();

// Prisma metrics middleware
if (!global.__prisma_metrics_mw_added) {
  prisma.$use(async (params, next) => {
    const end = startPrismaTimer({ 
      model: params.model as string, 
      action: params.action 
    });
    
    incPrismaQuery({ 
      model: params.model as string, 
      action: params.action 
    });
    
    try {
      const result = await next(params);
      return result;
    } finally {
      end();
    }
  });
  
  global.__prisma_metrics_mw_added = true;
}

// Export the Prisma client
export { prisma };

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
