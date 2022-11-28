const core = require('@actions/core');
const github = require('@actions/github');
const os = require('os');
const path = require('path');
const SettingsGenerator = require('./SettingsGenerator');

try {
	const cfg = {
		path: core.getInput('path'),
		servers: JSON.parse(core.getInput('servers')),
		serversGH: JSON.parse(core.getInput('serversGH'))
	}

	cfg.path = cfg.path.split("/").join(path.sep)

	// "~" does not seem to get resolved by node
	if(cfg.path.startsWith("~")) {
		cfg.path = os.homedir() + cfg.path.substr(1);
	}

	new SettingsGenerator().run(cfg)
} catch (error) {
	core.setFailed(error.message);
}