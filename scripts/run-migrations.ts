import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import * as db from "~/lib/database";

config();

async function runMigrations() {
    const migrationsDir = path.join(process.cwd(), "database", "migrations");

    if (!fs.existsSync(migrationsDir)) {
        console.error(`Migrations directory not found: ${migrationsDir}`);
        process.exit(1);
    }

    const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

    if (migrationFiles.length === 0) {
        process.exit(0);
    }

    for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);

        try {
            const sql = fs.readFileSync(filePath, "utf-8");
            await db.query(sql);
        } catch (error: any) {
            if (error?.code === "42P07" || error?.code === "42P06" || error?.code === "42710") {
                continue;
            }
            console.error(`✗ Failed: ${file}`);
            console.error(error);
            process.exit(1);
        }
    }

    process.exit(0);
}

runMigrations().catch((error) => {
    console.error("Migration runner error:", error);
    process.exit(1);
});
