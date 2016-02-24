module.exports = {
	context: __dirname + "/src",
	entry: "./relativity",
	output: {
		path: __dirname + "/example/js",
		filename: "relativity.js",
		libraryTarget: "umd",
		library: "Relativity"
	},
	 externals: {
        // require("jquery") is external and available
        //  on the global var jQuery
        "jquery": "jQuery"
    }
}