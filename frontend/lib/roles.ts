/** Shared role copy and registration choices. */

export type RoleSlug = "freelancer" | "brand";

export const ROLE_SLUGS: RoleSlug[] = ["freelancer", "brand"];

export function isRoleSlug(value: string): value is RoleSlug {
  return (ROLE_SLUGS as string[]).includes(value);
}

export const specializations = [
  "Writer & Content Strategist",
  "Copywriter",
  "Graphic Designer",
  "Video Creator",
  "Social Media Creator",
];

export const industries = [
  "B2B SaaS & Enterprise Software",
  "Consumer Goods",
  "Fintech",
  "Healthcare",
  "E-commerce & Retail",
];

export const orgSizes = ["1-50 Employees", "51-200 Employees", "201-1,000 Employees", "1,000+ Employees"];
