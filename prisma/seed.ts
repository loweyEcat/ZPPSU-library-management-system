import { config } from "dotenv";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from "../generated/prisma/client";

config();

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || '',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || '',
  connectionLimit: 5
});

const prisma = new PrismaClient({ adapter });

const PERMISSION_DEFINITIONS: Array<{ key: string; description: string }> = [
  {
    key: "manage_users",
    description: "Create, update, deactivate, and view all user accounts.",
  },
  {
    key: "manage_roles",
    description: "Create and update role definitions and permission mappings.",
  },
  {
    key: "manage_governor_applications",
    description: "Approve, reject, or request revisions to governor applications.",
  },
  {
    key: "review_governor_applications",
    description: "Review and comment on governor applications.",
  },
  {
    key: "manage_president_applications",
    description: "Approve, reject, or request revisions to president applications.",
  },
  {
    key: "review_president_applications",
    description: "Review and comment on president applications.",
  },
  {
    key: "manage_member_applications",
    description: "Approve, reject, or request revisions to member applications.",
  },
  {
    key: "review_member_applications",
    description: "Review and comment on member applications.",
  },
  {
    key: "manage_invites",
    description: "Generate, revoke, and monitor invitation tokens.",
  },
  {
    key: "view_audit_logs",
    description: "View immutable security and compliance audit logs.",
  },
  {
    key: "manage_security_events",
    description: "Respond to and resolve security events across the platform.",
  },
];

const ROLE_DEFINITIONS: Array<{
  name: string;
  description: string;
  isSystemDefault: boolean;
  permissionKeys: string[];
}> = [
  {
    name: "super_admin",
    description: "Full platform access for security and compliance owners.",
    isSystemDefault: true,
    permissionKeys: PERMISSION_DEFINITIONS.map((permission) => permission.key),
  },
  {
    name: "admin",
    description: "Administrative access for day-to-day operations.",
    isSystemDefault: true,
    permissionKeys: [
      "manage_users",
      "manage_roles",
      "manage_governor_applications",
      "manage_president_applications",
      "manage_member_applications",
      "manage_invites",
      "view_audit_logs",
    ],
  },
  {
    name: "eagle_regional_governor",
    description: "Regional governor capabilities and responsibilities.",
    isSystemDefault: true,
    permissionKeys: [
      "review_governor_applications",
      "manage_president_applications",
      "review_president_applications",
      "manage_invites",
    ],
  },
  {
    name: "eagle_club_president",
    description: "Club president access level.",
    isSystemDefault: true,
    permissionKeys: [
      "manage_member_applications",
      "review_member_applications",
      "manage_invites",
    ],
  },
  {
    name: "eagle_member",
    description: "Base Eagle member access level.",
    isSystemDefault: true,
    permissionKeys: [],
  },
];

async function seedPermissions() {
  const permissionMap = new Map<string, string>();

  for (const permission of PERMISSION_DEFINITIONS) {
    const record = await prisma.tfoe_permissions.upsert({
      where: { key: permission.key },
      update: {
        description: permission.description,
      },
      create: {
        key: permission.key,
        description: permission.description,
      },
      select: {
        id: true,
      },
    });
    permissionMap.set(permission.key, record.id);
  }

  return permissionMap;
}

async function seedRoles(permissionMap: Map<string, string>) {
  for (const role of ROLE_DEFINITIONS) {
    const record = await prisma.tfoe_roles.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        is_system_default: role.isSystemDefault,
      },
      create: {
        name: role.name,
        description: role.description,
        is_system_default: role.isSystemDefault,
      },
      select: {
        id: true,
      },
    });

    await prisma.tfoe_role_permissions.deleteMany({
      where: { role_id: record.id },
    });

    const permissionIds = role.permissionKeys
      .map((key) => permissionMap.get(key))
      .filter((value): value is string => Boolean(value));

    if (permissionIds.length > 0) {
      await prisma.tfoe_role_permissions.createMany({
        data: permissionIds.map((permissionId) => ({
          role_id: record.id,
          permission_id: permissionId,
        })),
        skipDuplicates: true,
      });
    }
  }
}

async function main() {
  console.info("Seeding RBAC permissions and roles…");
  const permissionMap = await seedPermissions();
  await seedRoles(permissionMap);
  console.info("RBAC seed completed.");
}

main()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

