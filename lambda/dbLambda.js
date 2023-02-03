const { getSecret } = require("./utils/ssm.js");
const { Pool } = require("pg");

exports.handler = async function (event) {
  const { httpMethod, resource, pathParameters, body, queryStringParameters } =
    event;
  const routeKey = `${httpMethod} ${resource}`;
  let statusCode = 200;
  let returnObject = {};
  let query, command, postId, title, content, user_name;

  const selectCommand =
    "select posts.post_id, posts.title, posts.content, posts.user_name, posts.created,";
  const groupCommand = "group by posts.post_id;";

  const { username, host, password, dbname, port } = await getSecret(
    process.env.DB_SECRET
  );

  const pool = new Pool({
    user: username,
    host: host,
    database: dbname,
    password: password,
    port: Number(port),
  });

  const needsId = [
    "GET /posts/{postId}",
    "DELETE /posts/{postId}",
    "PATCH /posts/{postId}",
    "POST /posts/{postId}",
    "DELETE /posts/{postId}/{commentId}",
  ];

  if (needsId.includes(routeKey)) {
    ({ postId } = pathParameters);
  }

  try {
    switch (routeKey) {
      case "GET /posts":
        const getMoreParam =
          "cast(count(distinct comments.comment_id) as integer) comments from \
          posts left join comments on comments.post_id=posts.post_id";
        command = `${selectCommand} ${getMoreParam} ${groupCommand}`;
        query = await pool.query(command);
        returnObject = { posts: query.rows };
        break;
      case "POST /posts":
        ({ title, content, user_name } = JSON.parse(body));
        command =
          "INSERT INTO posts(title,content,user_name) VALUES($1,$2,$3) RETURNING *;";
        query = await pool.query(command, [title, content, user_name]);
        returnObject = { post: query.rows[0], message: "successfully created" };
        break;
      case "GET /posts/{postId}":
        const getOneParam =
          "array_agg(json_build_object('comment_id',comments.comment_id,\
          'content',comments.content,'user_name',comments.user_name,'created',\
          comments.created))\
          filter(where comments.comment_id is not null) AS comments \
          from posts LEFT JOIN comments ON comments.post_id = posts.post_id";
        const where = `where posts.post_id=${postId}`;
        command = `${selectCommand} ${getOneParam} ${where} ${groupCommand}`;
        query = await pool.query(command);
        returnObject = { post: query.rows[0] };
        break;
      case "DELETE /posts/{postId}":
        command = `delete from posts where post_id=${postId};`;
        await pool.query(command);
        returnObject = {
          message: `successfully deleted post number ${postId}`,
        };
        break;
      case "PATCH /posts/{postId}":
        ({ title, content } = JSON.parse(body));
        command =
          "UPDATE posts set title=$1,content=$2 where post_id=$3 RETURNING *;";
        query = await pool.query(command, [title, content, postId]);
        returnObject = {
          post: query.rows[0],
          message: `successfully updated post number ${postId}`,
        };
        break;
      case "POST /posts/{postId}":
        ({ content, user_name } = JSON.parse(body));
        command =
          "INSERT INTO comments(post_id,content,user_name) values ($1,$2,$3) RETURNING *;";
        query = await pool.query(command, [postId, content, user_name]);
        returnObject = {
          post: query.rows[0],
          message: "successfully create comment for post",
        };
        break;
      case "DELETE /posts/{postId}/{commentId}":
        const { commentId } = pathParameters;
        command = `delete from comments where comment_id=${commentId}`;
        await pool.query(command);
        returnObject = {
          message: `successfully deleted coment number ${commentId}`,
        };
        break;
      default:
        statusCode = 404;
        returnObject = { message: "no resource found for that request" };
    }
  } catch (e) {
    statusCode = 400;
    returnObject = { message: e.message };
  }

  return {
    statusCode: statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(returnObject),
  };
};
