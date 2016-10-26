var base = require('./../../Base');

module.exports = function()
{
    function Command(res)
    {
        require(global.gulp.path+"/Tasks/"+res.Task+"/"+res.Task)();
    }

    return base
    .task('Default')
    .command(Command)
    .call();
}