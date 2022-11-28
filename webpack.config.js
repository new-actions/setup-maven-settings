const webpack = require('webpack');
const path = require('path');

console.log(__dirname)

module.exports = {
 	entry: './src/index.js',
 	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js',
 	},
	module: {
		rules: []
	},
	plugins: [],
	mode: "production",
	target: "node"
};