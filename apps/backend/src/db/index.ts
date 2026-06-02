import { Pool, QueryResultRow } from 'pg';
import { config } from '../config';

export const pool = new Pool({ connectionString: config.databaseUrl });

export async function query<T extends QueryResultRow>(text: string, params: Array<unknown> = []): Promise<{ rows: T[] }> {
  const result = await pool.query<T>(text, params);
  return { rows: result.rows };
}
