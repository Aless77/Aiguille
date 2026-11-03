import { z } from "zod";

export const accessRequestInput = z.object({
  motivation: z.string().trim().min(20).max(2000),
  origin: z.string().trim().min(2).max(300),
  interestedBrands: z.string().trim().min(2).max(500),
});

export const adminLoginInput = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(1024),
});
