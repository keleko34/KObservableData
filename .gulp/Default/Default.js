var gulp = require('gulp')
  , fs = require('fs')
  , prompt = require('gulp-prompt');

  var settings = global.gulp,
      tasks = fs.readdirSync(settings.base+"/.gulp").filter(function(t){
          return (t !== 'config.js' && t !== "Default");
      }),
      taskFiles = tasks.reduce(function(obj,v,k){
          obj[v] = require(settings.base+'/.gulp/'+v+"/"+v);
          return obj;
      },{});
      pres = {};

module.exports = function()
{
    

    return function(done)
    {
        var _prompt = prompt.prompt;

        console.log("running");
        var g = gulp.src('*');
        console.log(tasks);

        function rec()
        {
            g.pipe(_prompt({
                type: 'list',
                name: 'task',
                message: 'Which task would you like to run?',
                choices:tasks
            },function(res){
                pres = res;
                rec();
            }));
        }

        rec();
        return g;
    }
}