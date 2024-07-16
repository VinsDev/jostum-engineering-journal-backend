const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://journaldb_rb2z_user:gogMcynfTGYWTgVmQCD8wnp1po9mgUdy@dpg-cqbchk6ehbks73do38tg-a.oregon-postgres.render.com/journaldb_rb2z",
  ssl: {
    rejectUnauthorized: false
  }
});

const volumes = [
  { id: 1, number: 1, year: 2024 }
];

const categories = [
  { id: 1, name: "Mechanical Engineering" },
  { id: 2, name: "ELectrical Engineering" },
  { id: 3, name: "Civil Engineering" },
  { id: 4, name: "Agric And Environmental Engineering" }
];

const publications = [
  {
    id: "1",
    title: "Optimizing the Impacts of Process Factors on the Quality Indices of Multiple Rice (Oryza sativa L.) Varieties using Taguchi Technique",
    publishDate: "2023-07-26",
    views: 0,
    downloads: 0,
    volumeId: 1,
    categoryId: 4,
    issue: "3, December 2020",
    link: "/journals/engineering/2",
    author: "Mayowa Saheed Sanusi, Rahman Akinoso and Abdulquadri Alaka",
    abstract: "Inconsistence in rice quality during production can hinder its consumers' acceptability. This study investigated the impacts of process factors on the quality indices of five rice varieties using Taguchi technique. The processing factors [soaking temperature (65-75°C), soaking time (10-16 h), steaming time (20-30 min) and paddy moisture content (12-16%)] were interacted using Taguchi orthogonal array design of L9 (34). Paddy rice of FARO 44, FARO 52, FARO 60, FARO 61 and NERICA 8 were processed into polished parboiled rice using the conditions from the Taguchi interaction. The signal to noise ratio of Taguchi was used to evaluate the influence of processing conditions on the quality indices (milling recovery, head milled rice, white bellies, colour and lightness) using standard procedures. The optimum processing conditions for each rice variety was determined using composite desirability function (CDF) of numerical optimization. The impact of processing factors on the quality indices differs significantly on the rice variety. The milling recovery of the rice varieties ranges from 62.79 to 73.54%, head milled rice (59.81 to 71.63%), lightness value (22.92 -35.82), colour value (21.55 – 28.65) and white bellies (0.16 – 14.17%), respectively. However, the optimum processing conditions vary from one rice variety to the other with CDF that ranges from 0.82 - 0.96. Taguchi technique was successfully used to understand the impact of processing factors on the quality indices. The optimum processing conditions for achieving acceptable quality indices for the five rice varieties were predicted. This information would be useful in process optimization during rice processing.",
    keywords: "Processing factors, Quality indices, Rice varieties, Taguchi technique, Numerical optimization"
  },
  {
    id: "2",
    title: "Effects of Stirrups Spacing on the Flexural Strength of Reinforced Concrete Beams",
    publishDate: "2023-07-26",
    views: 0,
    downloads: 0,
    volumeId: 1,
    categoryId: 3,
    issue: "3, December 2020",
    link: "/journals/engineering/2",
    author: "H. O. Ozioko",
    abstract: "The work investigated reinforced concrete beam with stirrup spacing at close and wide range intervals of 150 mm, 200 mm, 300 mm, 400 mm, 600 mm and 1200 mm respectively. The 12 mm beam is tied in place with 8 mm stirrup bar and subjected to flexural strength (Modulus of Rupture) test. Metal formwork was prepared using 2mm metal plate and 5 mm metal angle bar. The formwork was fabricated to assume an internal dimension of 1200 mm (length) X 225 mm (depth) X 150 mm (width) with a concrete cover of 25 mm all round to ensure adequate protection of the reinforcing bars from corrosion caused by environmental effect. The average characteristic yield strength of 12 mm and 8 mm reinforcing bars used were determined to be 406 N/mm2 and 382 N/mm2 respectively. Concrete mixed in accordance with BS5328 specification with a mix ratio of 1:2:4 and grade M15 was poured inside the formwork housing the steel reinforcements with adequate vibration at calculated intervals. Thereafter the reinforced concrete beam was allowed to cure for 7, 14, 21 and 28 days before being subjected to flexural test in laboratory. The results showed flexural strength gain, increase in carrying capacity of the beam, decrease in cracking as the stirrup spacing decreases vice versa.",
    keywords: "Reinforced, concrete, flexural, characteristic, yield and strength"
  }
];

const insertVolume = async (volume) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO volumes (id, number, year)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
      number = EXCLUDED.number,
      year = EXCLUDED.year
    `;
    await client.query(query, [volume.id, volume.number, volume.year]);
    console.log(`Volume ${volume.id} inserted/updated successfully`);
  } catch (err) {
    console.error(`Error inserting/updating volume ${volume.id}:`, err);
  } finally {
    client.release();
  }
};

const insertCategory = async (category) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO categories (id, name)
      VALUES ($1, $2)
      ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name
    `;
    await client.query(query, [category.id, category.name]);
    console.log(`Category ${category.id} inserted/updated successfully`);
  } catch (err) {
    console.error(`Error inserting/updating category ${category.id}:`, err);
  } finally {
    client.release();
  }
};

const insertPublication = async (publication) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO publications 
      (id, title, "publishDate", views, downloads, "volumeId", "categoryId", issue, link, author, abstract, keywords)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      "publishDate" = EXCLUDED."publishDate",
      views = EXCLUDED.views,
      downloads = EXCLUDED.downloads,
      "volumeId" = EXCLUDED."volumeId",
      "categoryId" = EXCLUDED."categoryId",
      issue = EXCLUDED.issue,
      link = EXCLUDED.link,
      author = EXCLUDED.author,
      abstract = EXCLUDED.abstract,
      keywords = EXCLUDED.keywords
    `;
    await client.query(query, [
      publication.id,
      publication.title,
      publication.publishDate,
      publication.views,
      publication.downloads,
      publication.volumeId,
      publication.categoryId,
      publication.issue,
      publication.link,
      publication.author,
      publication.abstract,
      publication.keywords
    ]);
    console.log(`Publication ${publication.id} inserted/updated successfully`);
  } catch (err) {
    console.error(`Error inserting/updating publication ${publication.id}:`, err);
  } finally {
    client.release();
  }
};

const populateDatabase = async () => {
  for (const volume of volumes) {
    await insertVolume(volume);
  }
  for (const category of categories) {
    await insertCategory(category);
  }
  for (const publication of publications) {
    await insertPublication(publication);
  }
  await pool.end();
};

populateDatabase();