const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path')

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

const db = new Pool({
    connectionString: "postgresql://journaldb_rb2z_user:gogMcynfTGYWTgVmQCD8wnp1po9mgUdy@dpg-cqbchk6ehbks73do38tg-a.oregon-postgres.render.com/journaldb_rb2z",
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
    } else {
        console.log('Connected to the database');
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server healthy' });
})

// Route to get all journals
app.get('/get-publications', (req, res) => {
    const { category, volume } = req.query;

    // Construct the base query
    let sql = `
        SELECT p.*, c.name AS category_name, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN volumes v ON p."volumeId" = v.id
    `;

    // Prepare parameters array for filtering
    const params = [];

    // Check if category filter is provided
    if (category) {
        sql += ' WHERE p."categoryId" = $1';
        params.push(category);
    }

    // Check if volume filter is provided
    if (volume) {
        if (params.length === 0) {
            sql += ' WHERE p."volumeId" = $1';
        } else {
            sql += ' AND p."volumeId" = $2';
        }
        params.push(volume);
    }

    sql += ' ORDER BY p.id DESC';

    // Execute the query with optional filters
    db.query(sql, params)
        .then(result => {
            res.json(result.rows);
        })
        .catch(error => {
            console.error('Error retrieving publications:', error);
            res.status(500).json({ error: 'Failed to retrieve publications' });
        });
});

app.get('/get-recent-publications', (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN categories c ON p."categoryId" = c.id
        LEFT JOIN volumes v ON p."volumeId" = v.id
        ORDER BY p.id DESC
        LIMIT 10
    `;

    db.query(sql)
        .then(result => {
            res.json(result.rows);
        })
        .catch(error => {
            console.error('Error retrieving latest publications:', error);
            res.status(500).json({ error: 'Failed to retrieve latest publications' });
        });
});

app.get('/get-publication/:id', (req, res) => {
    const { id } = req.params;

    // Construct the query to get a single publication by ID
    const sql = `
        SELECT p.*, c.name AS category_name, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN volumes v ON p.volumeId = v.id
        WHERE p.id = $1
    `;

    // Execute the query with the provided ID
    db.query(sql, [id])
        .then(result => {
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Publication not found' });
            } else {
                // Assuming the ID is unique, there should be only one result
                res.json(result.rows[0]);
            }
        })
        .catch(error => {
            console.error('Error retrieving publication:', error);
            res.status(500).json({ error: 'Failed to retrieve publication' });
        });
});

app.put('/update-views/:id', (req, res) => {
    const publicationId = req.params.id;

    const sql = `
        UPDATE publications
        SET views = views + 1
        WHERE id = $1
        RETURNING *
    `;

    db.query(sql, [publicationId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Publication not found' });
            } else {
                res.status(200).json({ message: 'Publication views updated successfully' });
            }
        })
        .catch(error => {
            console.error('Error updating publication views:', error);
            res.status(500).json({ error: 'Failed to update publication views' });
        });
});

app.put('/update-downloads/:id', (req, res) => {
    const publicationId = req.params.id;

    const sql = `
        UPDATE publications
        SET downloads = downloads + 1
        WHERE id = $1
        RETURNING *
    `;

    db.query(sql, [publicationId])
        .then(result => {
            if (result.rowCount === 0) {
                res.status(404).json({ error: 'Publication not found' });
            } else {
                res.status(200).json({ message: 'Publication downloads updated successfully' });
            }
        })
        .catch(error => {
            console.error('Error updating publication downloads:', error);
            res.status(500).json({ error: 'Failed to update publication downloads' });
        });
});

app.get('/download-publication/:id', (req, res) => {
    const { id } = req.params;

    // Query to get the publication details including volume information
    const sql = `
        SELECT p.*, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN volumes v ON p.volumeId = v.id
        WHERE p.id = $1
    `;

    db.query(sql, [id])
        .then(result => {
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Publication not found' });
                return;
            }

            const publication = result.rows[0];
            const volumePath = `volume-${publication.volumeId}`;
            const fileName = `${publication.id}.pdf`;

            // Construct the absolute path to the file
            const absolutePath = path.join(__dirname, 'publications', volumePath, fileName);

            res.download(absolutePath, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    res.status(500).json({ error: 'Failed to download file' });
                }
            });
        })
        .catch(error => {
            console.error('Error retrieving publication:', error);
            res.status(500).json({ error: 'Failed to retrieve publication' });
        });
});

app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories')
        .then(result => {
            res.json(result.rows);
        })
        .catch(error => {
            console.error('Error retrieving categories:', error);
            res.status(500).json({ error: 'Failed to retrieve categories' });
        });
});

app.get('/volumes', (req, res) => {
    db.query('SELECT * FROM volumes')
        .then(result => {
            res.json(result.rows);
        })
        .catch(error => {
            console.error('Error retrieving volumes:', error);
            res.status(500).json({ error: 'Failed to retrieve volumes' });
        });
});

app.post('/upload-publication', (req, res) => {
    const {
        id,
        title,
        publishDate,
        views,
        downloads,
        volumeId,
        categoryId,
        issue,
        link,
        author,
        abstract,
        keywords
    } = req.body;

    const sql = `
        INSERT INTO publications 
        (id, title, "publishDate", views, downloads, "volumeId", "categoryId", issue, link, author, abstract, keywords)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
    `;

    db.query(sql, [id, title, publishDate, views, downloads, volumeId, categoryId, issue, link, author, abstract, keywords])
        .then(result => {
            res.status(200).json({ message: 'Publication uploaded successfully', publicationId: result.rows[0].id });
        })
        .catch(error => {
            console.error('Error inserting publication:', error);
            res.status(500).json({ error: 'Failed to upload publication' });
        });
});

app.post('/upload-category', (req, res) => {
    const { name } = req.body;
    const sql = `INSERT INTO categories (name) VALUES ($1) RETURNING id`;

    db.query(sql, [name])
        .then(result => {
            res.status(200).json({
                message: 'Category uploaded successfully',
                categoryId: result.rows[0].id
            });
        })
        .catch(error => {
            console.error('Error inserting category:', error);
            res.status(500).json({ error: 'Failed to upload category' });
        });
});

app.post('/upload-volume', (req, res) => {
    const { number, year } = req.body;
    const sql = `INSERT INTO volumes (number, year) VALUES ($1, $2) RETURNING id`;

    db.query(sql, [number, year])
        .then(result => {
            res.status(200).json({
                message: 'Volume uploaded successfully',
                volumeId: result.rows[0].id
            });
        })
        .catch(error => {
            console.error('Error inserting volume:', error);
            res.status(500).json({ error: 'Failed to upload volume' });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
