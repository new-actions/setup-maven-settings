const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { XMLParser, XMLBuilder } = require("fast-xml-parser");

const parser = new XMLParser({ ignoreAttributes: false, ignoreDeclaration: true, });
const builder = new XMLBuilder({ format: true, ignoreAttributes: false, ignoreDeclaration: true });
  
const DEFAULT = `<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
	<servers />
</settings>
`

const validateConfig = (cfg) => {
	if(cfg === undefined || typeof cfg !== "object") {
		throw new Error("cfg undefined or not an object")
	}
	if(cfg.path === undefined || typeof cfg.path !== "string") {
		throw new Error("cfg.path undefined or not a string")
	}
	if(cfg.servers === undefined || !Array.isArray(cfg.servers)) {
		throw new Error("cfg.servers undefined or not an array")
	}
	if(cfg.serversGH === undefined || !Array.isArray(cfg.serversGH)) {
		throw new Error("cfg.serversGH undefined or not an array")
	}
	cfg.servers.forEach(s => {
		if((!!s) && (s.constructor !== Object)) {
			throw new Error("cfg.servers contains a non-object")
		}
	})
	cfg.serversGH.forEach(s => {
		if(typeof s !== "string") {
			throw new Error("cfg.serversGH contains a non-string")
		}
	})
}

function expandGH(s) {
	return { id: s, username: "${env.GITHUB_ACTOR}", password: "${env.GITHUB_TOKEN}"}
}

function addServer(servers, next) {
	// handle incomplete config
	if(!next.hasOwnProperty("id") || next.id === undefined || next.id == "") {
		throw new Error("a server id is non-existent, empty, or undefined")
	}
	if(!next.hasOwnProperty("username") || next.username === undefined) {
		next.username = ""
	}
	if(!next.hasOwnProperty("password") || next.password === undefined) {
		next.password = ""
	}

	// ensure specific serialization order
	var tmp = next.password
	delete next.password
	next.password = tmp

	// add server
	servers.forEach(server => {
		if(server.id == next.id) {
			throw new Error("duplicate server id: " + next.id)
		}
	})
	servers.push(next)
}

module.exports = class {
	run(cfg) {
		console.log(`Config: ${JSON.stringify(cfg)}`)
		validateConfig(cfg)

		const xml = existsSync(cfg.path) ? readFileSync(cfg.path, 'utf8') : DEFAULT;
		var obj = parser.parse(xml)

		if(!obj.settings.hasOwnProperty("servers") || obj.settings.servers == "") {
			obj.settings.servers = {}
		}
		var servers = obj.settings.servers

		if(!servers.hasOwnProperty("server")) {
			servers.server = []
		} else if(!Array.isArray(servers.server)) {
			servers.server = [ servers.server ]
		}

		cfg.servers.forEach(s => {
			addServer(obj.settings.servers.server, s)
		})
		cfg.serversGH.forEach(s => {
			addServer(obj.settings.servers.server, expandGH(s))
		})

		const out = builder.build(obj);
    	writeFileSync(cfg.path, out, "utf8")
	}
}