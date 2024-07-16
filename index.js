const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path')

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Create a MySQL connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'winner',
    database: 'journal_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Route to get all journals
app.get('/get-publications', (req, res) => {
    const { category, volume } = req.query;

    // Construct the base query
    let sql = `
        SELECT p.*, c.name AS category_name, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN volumes v ON p.volumeId = v.id
    `;

    // Prepare parameters array for filtering
    const params = [];

    // Check if category filter is provided
    if (category) {
        sql += ' WHERE p.categoryId = ?';
        params.push(category);
    }

    // Check if volume filter is provided
    if (volume) {
        if (params.length === 0) {
            sql += ' WHERE p.volumeId = ?';
        } else {
            sql += ' AND p.volumeId = ?';
        }
        params.push(volume);
    }

    sql += 'ORDER BY p.id DESC';

    // Execute the query with optional filters
    db.query(sql, params, (error, results) => {
        if (error) {
            console.error('Error retrieving publications:', error);
            res.status(500).json({ error: 'Failed to retrieve publications' });
            return;
        }
        res.json(results);
    });
});

app.get('/get-recent-publications', (req, res) => {
    const sql = `
        SELECT p.*, c.name AS category_name, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN categories c ON p.categoryId = c.id
        LEFT JOIN volumes v ON p.volumeId = v.id
        ORDER BY p.id DESC
        LIMIT 10
    `;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error retrieving latest publications:', error);
            res.status(500).json({ error: 'Failed to retrieve latest publications' });
            return;
        }
        res.json(results);
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
        WHERE p.id = ?
    `;

    // Execute the query with the provided ID
    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error retrieving publication:', error);
            res.status(500).json({ error: 'Failed to retrieve publication' });
            return;
        }
        // Assuming the ID is unique, there should be only one result
        res.json(results[0]);
    });
});

app.put('/update-views/:id', (req, res) => {
    const publicationId = req.params.id;

    const sql = `
        UPDATE publications
        SET views = views + 1
        WHERE id = ?
    `;

    db.query(sql, [publicationId], (error, result) => {
        if (error) {
            console.error('Error updating publication views:', error);
            res.status(500).json({ error: 'Failed to update publication views' });
            return;
        }
        res.status(200).json({ message: 'Publication views updated successfully' });
    });
});

app.put('/update-downloads/:id', (req, res) => {
    const publicationId = req.params.id;

    const sql = `
        UPDATE publications
        SET downloads = downloads + 1
        WHERE id = ?
    `;

    db.query(sql, [publicationId], (error, result) => {
        if (error) {
            console.error('Error updating publication views:', error);
            res.status(500).json({ error: 'Failed to update publication views' });
            return;
        }
        res.status(200).json({ message: 'Publication views updated successfully' });
    });
});


app.get('/download-publication/:id', (req, res) => {
    const { id } = req.params;

    // Query to get the publication details including volume information
    const sql = `
        SELECT p.*, v.number AS volume_number, v.year AS volume_year
        FROM publications p
        LEFT JOIN volumes v ON p.volumeId = v.id
        WHERE p.id = ?
    `;

    db.query(sql, [id], (error, results) => {
        if (error) {
            console.error('Error retrieving publication:', error);
            res.status(500).json({ error: 'Failed to retrieve publication' });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ error: 'Publication not found' });
            return;
        }

        const publication = results[0];
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
    });
});



// Route to get all categories
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (error, results) => {
        if (error) {
            console.error('Error retrieving categories:', error);
            res.status(500).json({ error: 'Failed to retrieve categories' });
            return;
        }
        res.json(results);
    });
});

// Route to get all volumes
app.get('/volumes', (req, res) => {
    db.query('SELECT * FROM volumes', (error, results) => {
        if (error) {
            console.error('Error retrieving volumes:', error);
            res.status(500).json({ error: 'Failed to retrieve volumes' });
            return;
        }
        res.json(results);
    });
});

// Route to create a new journal
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

    const sql = `INSERT INTO publications (id, title, publishDate, views, downloads, volumeId, categoryId, issue, link, author, abstract, keywords)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [id, title, publishDate, views, downloads, volumeId, categoryId, issue, link, author, abstract, keywords], (err, result) => {
        if (err) {
            console.error('Error inserting publication:', err);
            res.status(500).json({ error: 'Failed to upload publication' });
            return;
        }
        res.status(200).json({ message: 'Publication uploaded successfully', publicationId: id });
    });
});

// Endpoint to upload a category
app.post('/upload-category', (req, res) => {
    const { name } = req.body;
    const sql = `INSERT INTO categories (name) VALUES (?)`;
    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error('Error inserting category:', err);
            res.status(500).json({ error: 'Failed to upload category' });
            return;
        }
        res.status(200).json({ message: 'Category uploaded successfully', categoryId: result.insertId });
    });
});

// Endpoint to upload a volume
app.post('/upload-volume', (req, res) => {
    const { number, year } = req.body;
    const sql = `INSERT INTO volumes (number, year) VALUES (?, ?)`;
    db.query(sql, [number, year], (err, result) => {
        if (err) {
            console.error('Error inserting volume:', err);
            res.status(500).json({ error: 'Failed to upload volume' });
            return;
        }
        res.status(200).json({ message: 'Volume uploaded successfully', volumeId: result.insertId });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
