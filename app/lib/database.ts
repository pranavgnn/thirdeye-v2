/**
 * Database module for ThirdEye.
 *
 * Provides a typed PostgreSQL wrapper with connection pooling, parameterized queries,
 * and transaction support. Designed for three main database schemas:
 * - Violation System (reporters, violations, images, AI assessments, fines)
 * - Admin Authentication (admin users, sessions)
 * - Audit Logging (comprehensive event tracking)
 *
 * @example
 * ```typescript
 * import * as db from "~/lib/database";
 *
 * const violation = await db.getOne<Violation>(
 *   "SELECT * FROM violations WHERE violation_id = $1",
 *   [123]
 * );
 *
 * const newReporter = await db.insert<Reporter>(
 *   "INSERT INTO reporters (ip_address, mac_address, device_info) VALUES ($1, $2, $3) RETURNING *",
 *   ["192.168.1.1", "AA:BB:CC:DD:EE:FF", { browser: "Chrome" }]
 * );
 *
 * await db.transaction(async () => {
 *   const violation = await db.insert("INSERT INTO violations (...) VALUES (...) RETURNING *", [...]);
 *   await db.insert("INSERT INTO fines (...) VALUES (...)", [...]);
 *   await db.insert("INSERT INTO audit_logs (...) VALUES (...)", [...]);
 * });
 * ```
 */

import { Pool, type QueryResult, type QueryResultRow } from "pg";

const getDatabaseUrl = (): string => {
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const host = process.env.POSTGRES_HOST || "localhost";
  const port = process.env.POSTGRES_PORT || "5432";
  const db = process.env.POSTGRES_DB;

  if (!user || !password || !db) {
    throw new Error(
      "Missing required database environment variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB"
    );
  }

  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
};

const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

/**
 * Executes a raw SQL query with parameterized values.
 *
 * Always use $1, $2, etc. placeholders to prevent SQL injection attacks.
 * Returns the complete query result including rows, row count, and metadata.
 *
 * @template T - Expected row type (e.g., Violation, Reporter, AdminUser)
 * @param text - SQL query with $1, $2, etc. placeholders
 * @param values - Array of values to substitute into placeholders
 * @returns Complete query result with rows array and metadata
 * @throws Error if query fails or connection issues occur
 *
 * @example
 * ```typescript
 * const result = await query<Violation>(
 *   "SELECT * FROM violations WHERE status = $1 AND violation_timestamp > $2",
 *   ["pending", new Date("2024-01-01")]
 * );
 * console.log(`Found ${result.rows.length} pending violations`);
 * ```
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
): Promise<QueryResult<T>> {
  try {
    const result = await pool.query<T>(text, values);
    return result;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Retrieves a single row from the database.
 *
 * Useful for fetching specific records by ID or unique constraints.
 * Returns null if no matching row is found.
 *
 * @template T - Expected row type
 * @param text - SQL query string with placeholders
 * @param values - Parameter values for the query
 * @returns First matching row or null if not found
 *
 * @example
 * ```typescript
 * const violation = await getOne<Violation>(
 *   "SELECT * FROM violations WHERE violation_id = $1",
 *   [123]
 * );
 *
 * const admin = await getOne<AdminUser>(
 *   "SELECT * FROM admin_users WHERE username = $1 AND is_active = true",
 *   ["admin@example.com"]
 * );
 * ```
 */
export async function getOne<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
): Promise<T | null> {
  const result = await query<T>(text, values);
  return result.rows[0] || null;
}

/**
 * Retrieves multiple rows from the database.
 *
 * Returns an empty array if no matches are found. Ideal for list views,
 * filtered queries, and reporting.
 *
 * @template T - Expected row type
 * @param text - SQL query string with placeholders
 * @param values - Parameter values for the query
 * @returns Array of matching rows (empty if no results)
 *
 * @example
 * ```typescript
 * const pendingViolations = await getMany<Violation>(
 *   "SELECT * FROM violations WHERE status = $1 ORDER BY violation_timestamp DESC LIMIT $2",
 *   ["pending", 50]
 * );
 *
 * const recentFines = await getMany<Fine>(
 *   "SELECT * FROM fines WHERE issued_timestamp > $1 AND fine_status = $2",
 *   [new Date("2024-01-01"), "issued"]
 * );
 * ```
 */
export async function getMany<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
): Promise<T[]> {
  const result = await query<T>(text, values);
  return result.rows;
}

/**
 * Inserts a new record and returns the created row.
 *
 * The query must include a RETURNING clause to get the inserted data.
 * Commonly used with RETURNING * to get all columns including generated IDs.
 *
 * @template T - Expected row type of the inserted record
 * @param text - INSERT query with RETURNING clause
 * @param values - Values to insert
 * @returns The inserted row or null if RETURNING clause is missing
 *
 * @example
 * ```typescript
 * const reporter = await insert<Reporter>(
 *   `INSERT INTO reporters (ip_address, mac_address, device_info, location)
 *    VALUES ($1, $2, $3, point($4, $5)) RETURNING *`,
 *   ["192.168.1.1", "AA:BB:CC:DD:EE:FF", { os: "Windows" }, 28.7041, 77.1025]
 * );
 *
 * const assessment = await insert<AIAssessment>(
 *   `INSERT INTO ai_assessments (image_id, confidence_level, violation_detected, vehicle_detected, is_india)
 *    VALUES ($1, $2, $3, $4, $5) RETURNING *`,
 *   [imageId, 95.5, true, true, true]
 * );
 * ```
 */
export async function insert<T extends QueryResultRow = any>(
  text: string,
  values?: any[]
): Promise<T | null> {
  const result = await query<T>(text, values);
  return result.rows[0] || null;
}

/**
 * Updates existing records and returns the number of affected rows.
 *
 * Returns 0 if no records match the WHERE clause. Use with RETURNING clause
 * if you need the updated data.
 *
 * @param text - UPDATE query with WHERE clause
 * @param values - Values for SET and WHERE clauses
 * @returns Number of rows that were updated
 *
 * @example
 * ```typescript
 * const updated = await update(
 *   "UPDATE violations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE violation_id = $2",
 *   ["manual_verification_approved", 123]
 * );
 *
 * const paidCount = await update(
 *   "UPDATE fines SET fine_status = $1, payment_date = $2, payment_method = $3 WHERE fine_id = $4",
 *   ["paid", new Date(), "credit_card", 456]
 * );
 * ```
 */
export async function update(
  text: string,
  values?: any[]
): Promise<number> {
  const result = await query(text, values);
  return result.rowCount || 0;
}

/**
 * Deletes records and returns the number of affected rows.
 *
 * Returns 0 if no records match the WHERE clause. Be cautious with DELETE
 * operations - consider soft deletes (status flags) for audit trail purposes.
 *
 * @param text - DELETE query with WHERE clause
 * @param values - Values for WHERE clause
 * @returns Number of rows that were deleted
 *
 * @example
 * ```typescript
 * const deleted = await remove(
 *   "DELETE FROM admin_sessions WHERE is_active = false AND last_activity_timestamp < $1",
 *   [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
 * );
 *
 * const removedLogs = await remove(
 *   "DELETE FROM audit_logs WHERE event_timestamp < $1",
 *   [new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)]
 * );
 * ```
 */
export async function remove(
  text: string,
  values?: any[]
): Promise<number> {
  const result = await query(text, values);
  return result.rowCount || 0;
}

/**
 * Begins a database transaction.
 *
 * Use this for manual transaction control when you need fine-grained handling.
 * Must be followed by either commit() or rollback(). For most cases, prefer
 * the transaction() helper function for automatic transaction management.
 *
 * @throws Error if transaction cannot be started
 */
export async function beginTransaction(): Promise<void> {
  await query("BEGIN");
}

/**
 * Commits the current transaction, persisting all changes.
 *
 * All queries executed since beginTransaction() become permanent in the database.
 *
 * @throws Error if commit fails or no transaction is active
 */
export async function commit(): Promise<void> {
  await query("COMMIT");
}

/**
 * Rolls back the current transaction, discarding all changes.
 *
 * All queries executed since beginTransaction() are undone. The database
 * returns to its state before the transaction began.
 *
 * @throws Error if rollback fails or no transaction is active
 */
export async function rollback(): Promise<void> {
  await query("ROLLBACK");
}

/**
 * Executes a callback function within an automatically managed transaction.
 *
 * Commits if the callback succeeds, rolls back if it throws an error.
 * This is the recommended way to handle multi-step operations that must
 * succeed or fail as a unit (e.g., creating a violation with fine and audit log).
 *
 * @template T - Return type of the callback function
 * @param callback - Async function containing database operations
 * @returns The value returned by the callback
 * @throws Error from callback or transaction management
 *
 * @example
 * ```typescript
 * const result = await transaction(async () => {
 *   const violation = await insert<Violation>(
 *     "INSERT INTO violations (...) VALUES (...) RETURNING *",
 *     [...]
 *   );
 *
 *   await insert(
 *     "INSERT INTO fines (violation_id, fine_amount, traffic_rule_violated) VALUES ($1, $2, $3)",
 *     [violation.violation_id, 500, "Red Light Violation"]
 *   );
 *
 *   await insert(
 *     "INSERT INTO audit_logs (event_type, violation_id, action_details) VALUES ($1, $2, $3)",
 *     ["fine_issued", violation.violation_id, { auto_generated: true }]
 *   );
 *
 *   return violation;
 * });
 * ```
 */
export async function transaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  await beginTransaction();
  try {
    const result = await callback();
    await commit();
    return result;
  } catch (error) {
    await rollback();
    throw error;
  }
}

/**
 * Closes all connections in the pool.
 *
 * Call this during application shutdown to ensure clean database disconnection.
 * Typically used in server shutdown handlers or process exit listeners.
 *
 * @throws Error if pool closure fails
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

/**
 * Returns the underlying pg Pool instance for advanced operations.
 *
 * Use this only when the standard query functions don't meet your needs,
 * such as for streaming large result sets or using Pool-specific features.
 *
 * @returns The active PostgreSQL connection pool
 *
 * @example
 * ```typescript
 * const pool = getPool();
 * const client = await pool.connect();
 * try {
 *   const stream = client.query(new QueryStream("SELECT * FROM violations"));
 *   stream.on("data", row => console.log(row));
 * } finally {
 *   client.release();
 * }
 * ```
 */
export function getPool(): Pool {
  return pool;
}

export default {
  query,
  getOne,
  getMany,
  insert,
  update,
  remove,
  beginTransaction,
  commit,
  rollback,
  transaction,
  closePool,
  getPool,
};
