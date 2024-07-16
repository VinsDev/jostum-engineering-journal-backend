const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://journaldb_rb2z_user:gogMcynfTGYWTgVmQCD8wnp1po9mgUdy@dpg-cqbchk6ehbks73do38tg-a.oregon-postgres.render.com/journaldb_rb2z",
    ssl: {
        rejectUnauthorized: false
    }
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS volumes (
        id SERIAL PRIMARY KEY,
        number INT NOT NULL,
        year INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS publications (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        "publishDate" DATE,
        views INT DEFAULT 0,
        downloads INT DEFAULT 0,
        "volumeId" INT REFERENCES volumes(id),
        "categoryId" INT REFERENCES categories(id),
        issue VARCHAR(255),
        link TEXT,
        author TEXT,
        abstract TEXT,
        keywords TEXT
      );
    `);
        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables', err);
    } finally {
        client.release();
        await pool.end();
    }
};

createTables();