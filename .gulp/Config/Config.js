module.exports = {
  Tasks: {
    Default: require('./Tasks/Default'),
    Server: require('./Tasks/Server'),
    Test: require('./Tasks/Test'),
    Task: require('./Tasks/Task'),
    Watch: require('./Tasks/Watch'),
    Build: require('./Tasks/Build')
  },
  ignore:[
        "test",
        "bower_components",
        "node_modules",
        ".gulp",
        ".git"
    ]
}
