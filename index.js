const restify = require("restify");
const mariadb = require("mariadb");
require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: "osu",
  connectionLimit: 5,
});

function respond(req, res, next) {
  res.send("pong");
  next();
}

async function osuGetChatEntries(req, res) {
  const { username, channel, keywords, offset = 0, limit = 20 } = req.query;

  let conn;
  try {
    conn = await pool.getConnection();

    let query = "SELECT * FROM chat WHERE 1=1";
    const params = [];

    if (username) {
      query += " AND username = ?";
      params.push(username);
    }
    if (channel) {
      query += " AND channel = ?";
      params.push(channel);
    }
    if (keywords) {
      query += " AND message LIKE ?";
      params.push(`%${keywords}%`);
    }

    query += " ORDER BY time DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const rows = await conn.query(query, params);

    res.send(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Database error" });
  } finally {
    if (conn) conn.release();
  }
}

const server = restify.createServer();

server.use(restify.plugins.queryParser());
server.use(function crossOrigin(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  return next();
});

server.get("/ping", respond);
server.get("/api/osu/chat", osuGetChatEntries);

server.listen(8080, function () {
  console.log("%s listening at %s", server.name, server.url);
});
