import { DuckDBInstance } from '@duckdb/node-api';
import { logger, LogLevel } from '@mazito/logger';

export {
  exec, 
  query,
  open
}

const logLevel = LogLevel.DEBUG;

/**
 * Opens a connection to the database
 * @returns a Db connection
 */
async function open(dbname: string): Promise<any | null> {
  try {
    dbname = dbname || './temp.db';
    const db = await DuckDBInstance.create(dbname, {
      access_mode: 'READ_WRITE' // or 'READ_ONLY'
    }); 
    const dbx = await db.connect();
    logger.info(`duckdb open db '${dbname}':`, JSON.stringify(dbx));
    return dbx;
  }
  catch (err) {
    logger.fatal(`duckdb open db '${dbname}':`, err);
    return null;
  }
}

/**
 * Executes an SQL statement
 * @param stmt 
 * @returns - true if Ok, false if exec failed
 */
async function exec(dbx: any, stmt: string): Promise<boolean> {
  if (!dbx || !stmt) return false;
  stmt = cleanup(stmt);
  try {
    logger.level(logLevel);
    logger.timer(`duckdb exec stmt= ${stmt}`);
    const done = await dbx.run(stmt);
    logger.elapsed(`duckdb exec done= `, JSON.stringify(done));
    return true;
  }
  catch (err) {
    logger.error(`duckdb exec `, err);
    return false;
  }
}

/**
 * Query the Db
 * @param @dbx - an open Duckdb connection
 * @param stmt - the SQL query to run
 * @param onEach - optional, if present runs the callback on every row
 * @returns 
 */
async function query(
  dbx: any, 
  stmt: string,
  onEach?: (r: any) => void
): Promise<any[]> {
  if (!dbx || !stmt) return [];
  stmt = cleanup(stmt);
  try {
    logger.level(logLevel);
    logger.timer(`duckdb query stmt= ${stmt}`);
    const reader = await dbx.runAndReadAll(stmt);
    const rows = reader.getRows();
    
    const n = rows.length;
    logger.elapsed(`duckdb query done= ${n} rows`);
    logger.debug(`duckdb query row 0: `, rows[0]);
    logger.debug(`duckdb query row ${n-1}:`, rows[n-1]);

    // run the callback on each row
    // console.log(onEach);
    if (onEach) (rows || []).forEach((r: any) => onEach(r))

    return rows;
  }
  catch (err) {
    logger.error(`duckdb query `, err);
    return [];
  }
}

// HELPERS /////////////////////////////////////////////////////////////////////

function cleanup(s: string) {
  return (s || '')
    .replace(/[\n\t\r]/g, '') // remove newlines and tabs
    .replace(/\s+/g, ' ')     // replace multiple spaces with a single space
    .trim(); 
}
