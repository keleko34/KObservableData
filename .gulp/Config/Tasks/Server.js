module.exports = {
  commands: {
    Port: {
      cmd: {
        short: "-p",
        long: "--port"
      },
      prompt: {
        type: "input",
        message: "Please enter a port for the server to use"
      },
      action:'Reload'
    },
    Root: {
      cmd: {
        short: "-r",
        long: "--root"
      },
      prompt: {
        type: "input",
        message: "Please specify a root filepath"
      },
      action:'end'
    }
  }
}
