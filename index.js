const restify = require("restify");
const mariadb = require("mariadb");
const { LegacyClient } = require("osu-web.js");
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

async function osuGetUserID(req, res) {
  const legacyApi = new LegacyClient(process.env.OSU_LEGACY_API_KEY);
  const { user } = req.params;

  if (user == undefined || user == null || typeof user !== "string") {
    return res.send();
  }

  await legacyApi
    .getUser({
      u: user,
    })
    .then((response) => {
      return res.send(response);
    });
}

async function osuGetUserIDImage(req, res) {
  const legacyApi = new LegacyClient(process.env.OSU_LEGACY_API_KEY);
  const { user } = req.params;

  if (user == undefined || user == null || typeof user !== "string") {
    return res.send();
  }

  await legacyApi
    .getUser({
      u: user,
    })
    .then((response) => {
      if (response == null) {
        return res.redirect(`https://a.ppy.sh/3?1337.jpeg`, () => {});
      }

      return res.redirect(
        `https://a.ppy.sh/${response.user_id}?1337.jpeg`,
        () => {},
      );
    });
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
server.get("/api/osu/user/:user", osuGetUserID);
server.get("/api/osu/image/:user", osuGetUserIDImage);

server.listen(8080, function () {
  console.log("%s listening at %s", server.name, server.url);
});
