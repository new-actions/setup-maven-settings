const { existsSync } = require("node:fs");
const { unlink, readFile, writeFile } = require("node:fs/promises");
const SettingsGenerator = require("../src/SettingsGenerator");

var log;
var sut;

beforeEach(async () => {
	log = []
	sut = new SettingsGenerator()
	if(existsSync(SOME_FILE)) {
		await unlink(SOME_FILE)
	}
})

afterEach(async () => {
	if(existsSync(SOME_FILE)) {
		await unlink(SOME_FILE)
	}
})

test("undefined config throws", () => {
	expect(() => { sut.run() }).toThrow("cfg undefined or not an object")
})

test("undefined cfg.path throws", () => {
	var cfg = getSomeValidConfig()
	delete cfg.path;
	expect(() => { sut.run(cfg) }).toThrow("cfg.path undefined or not a string")
})

test("undefined cfg.servers throws", () => {
	var cfg = getSomeValidConfig()
	delete cfg.servers;
	expect(() => { sut.run(cfg) }).toThrow("cfg.servers undefined or not an array")
})

test("undefined cfg.serversGH throws", () => {
	var cfg = getSomeValidConfig()
	delete cfg.serversGH;
	expect(() => { sut.run(cfg) }).toThrow("cfg.serversGH undefined or not an array")
})

test("servers without object throw", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0] = "...";
	expect(() => { sut.run(cfg) }).toThrow("cfg.servers contains a non-object")
})

test("servers without id throws", async () => {
	var cfg = getSomeValidConfig()
	delete cfg.servers[0].id;
	expect(() => { sut.run(cfg) }).toThrow("a server id is non-existent, empty, or undefined")
})

test("servers with undefined id throws", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].id = undefined;
	expect(() => { sut.run(cfg) }).toThrow("a server id is non-existent, empty, or undefined")
})

test("servers with empty id throws", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].id = "";
	expect(() => { sut.run(cfg) }).toThrow("a server id is non-existent, empty, or undefined")
})

test("non-string in cfg.serversGH", () => {
	var cfg = getSomeValidConfig()
	cfg.serversGH.push([1, 2, 3])
	expect(() => { sut.run(cfg) }).toThrow("cfg.serversGH contains a non-string")
})

test("serversGH with undefined id throws", async () => {
	var cfg = getSomeValidConfig()
	cfg.serversGH[0] = undefined;
	expect(() => { sut.run(cfg) }).toThrow("cfg.serversGH contains a non-string")
})

test("serversGH with empty id throws", async () => {
	var cfg = getSomeValidConfig()
	cfg.serversGH[0] = "";
	expect(() => { sut.run(cfg) }).toThrow("a server id is non-existent, empty, or undefined")
})

test("servers without username", async () => {
	var cfg = getSomeValidConfig()
	delete cfg.servers[0].username;
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("servers with undefined username", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].username = undefined;
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("servers with empty username", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].username = "";
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("servers without password", async () => {
	var cfg = getSomeValidConfig()
	delete cfg.servers[0].password;
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "u", "")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("servers with undefined password", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].password = undefined;
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "u", "")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("servers with empty password", async () => {
	var cfg = getSomeValidConfig()
	cfg.servers[0].password = "";
	sut.run(cfg)
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "u", "")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("file does not exist", async () => {
	sut.run(getSomeValidConfig())
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("i", "u", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("file does exist with a server", async () => {
	await write("abc.xml", settings(`
		<servers>
			${server("a", "b", "c")}
		</servers>`))
	sut.run(getSomeValidConfig())
	var f = await read("abc.xml")
	var s = settings(`
		<servers>
			${server("a", "b", "c")}
			${server("i", "u", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`)
	expect(f).toEqual(s)
})

test("file does exist with unrelated property", async () => {
	await write(SOME_FILE, settings(`
		<foo>bar</foo>
	`))
	sut.run(getSomeValidConfig())
	var f = await read(SOME_FILE)
	expect(f).toEqual(settings(`
		<foo>bar</foo>
		<servers>
			${server("i", "u", "p")}
			${server("gh1", "${env.GITHUB_ACTOR}", "${env.GITHUB_TOKEN}")}
		</servers>
	`))
})

test("server exists in file", async () => {
	await write(SOME_FILE, settings(`
		<servers>
			${server("i", "u", "p")}
		</servers>
	`))
	expect(() => {sut.run(getSomeValidConfig())}).toThrow("duplicate server id: i")
})

test("server duplicate in config", async () => {
	var cfg = getSomeValidConfig()
	cfg.serversGH.push("gh1")
	expect(() => {sut.run(cfg)}).toThrow("duplicate server id: gh1")
})

const SOME_FILE = "abc.xml";

const getSomeValidConfig = () => {
	return {
		path: "abc.xml",
		servers: [ { id: "i", username: "u", password: "p" } ],
		serversGH: [ "gh1" ]
	}
}

const write = async (path, content) => {
	return writeFile(path, content, "utf8")
}

const read = async (path) => {
	return (await readFile(path, "utf8")).replace(/\s+/g, " ").trim()
}

const settings = (content) => {
	return (`<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" `
		+ `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" `
		+ `xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 `
		+ `https://maven.apache.org/xsd/settings-1.0.0.xsd">
${content}
</settings>`).replace(/\s+/g, " ")
}

const server = (id, user, pwd) => {
	return `<server> <id>${id}</id> <username>${user}</username> <password>${pwd}</password> </server>`
}