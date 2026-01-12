/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const rootDir = process.cwd();
loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(rootDir, ".env.local"));

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || "admin@polyvox.org";
const adminUsername = process.env.ADMIN_USERNAME || "admin";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) {
    throw error;
  }
  return data.users.find(
    (user) => user.email && user.email.toLowerCase() === email.toLowerCase(),
  );
}

async function ensureAdminUser() {
  const user = await findUserByEmail(adminEmail);

  if (!user) {
    console.log("Admin user not found.");
    console.log("Create the user in Supabase Auth first:");
    console.log(`Email: ${adminEmail}`);
    console.log(
      "Dashboard → Authentication → Users → Invite user or Create user.",
    );
    process.exit(1);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: adminUsername,
        display_name: adminUsername,
        location_country: "United States",
      },
      { onConflict: "id" },
    );
  if (profileError) {
    throw profileError;
  }

  const { error: roleError } = await supabase
    .from("user_global_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleError) {
    throw roleError;
  }

  const { error: prefError } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        theme_mode: "system",
        reduce_motion: false,
      },
      { onConflict: "user_id" },
    );
  if (prefError) {
    throw prefError;
  }

  console.log("Admin seed complete.");
  console.log(`Admin user: ${adminEmail}`);
  console.log("Role: admin");
}

ensureAdminUser().catch((error) => {
  console.error("Seed failed:", error?.message ?? error);
  process.exit(1);
});
