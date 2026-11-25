require("ts-node/register");

const assert = require("node:assert/strict");
const { test } = require("node:test");
const sequelize = require("../src/DB/dbConfig").default;
const DataBaseService = require("../src/Service/Database/Database").default;
const BlogGlobeFeedService = require("../src/Service/BlogGlobeFeedService/BlogGlobeFeedService").default;

test("unique places include the activity count for each name and coordinates group", async t => {
    const places = [
        { placeName: "Paris", longitude: 2.35, latitude: 48.86, count: 3 },
        { placeName: "Paris", longitude: -95.56, latitude: 33.66, count: 1 },
    ];
    const query = t.mock.method(sequelize, "query", async () => places);

    assert.deepEqual(await new BlogGlobeFeedService().fetchBlogUniquePlaces(), places);
    const sql = query.mock.calls[0].arguments[0];
    assert.match(sql, /COUNT\(\*\) AS `count`/);
    assert.match(sql, /GROUP BY `placeName`, `longitude`, `latitude`/);
});

test("groupBy without count preserves its original projection", async t => {
    const query = t.mock.method(sequelize, "query", async () => []);
    const result = await new DataBaseService().groupBy("BlogActivity", ["placeName"]);

    assert.deepEqual(result, { dataSuccess: true, data: [] });
    assert.doesNotMatch(query.mock.calls[0].arguments[0], /COUNT\(/);
});
