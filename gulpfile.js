require('K_Tasks')();

/*var gulp = require('gulp'),
    fs = require('fs');

global.gulp = {};
global.gulp.base = process.cwd().replace(/\\/g,"/");
global.gulp.path = global.gulp.base+"/.gulp";
global.gulp.config = require('./.gulp/Config/Config.js');*/

/* Gulp Task Modules

   This Auto loads all tasks inside the .gulp Tasks folder, simply put new tasks
   in there if you want them registered
*/
/*
try{
  tasks = fs.readdirSync('./.gulp/Tasks');
  if(tasks.length < 1){
    console.error('\033[31You have no tasks to use, please create tasks under .gulp/Tasks/ in a way as: task/task.js \033[37m');
    return;
  }
}
catch(e){
  if(e.code !== 'ENOENT'){
    console.error('\033[31You do not have a Tasks folder in .gulp \033[37m');
  }
  console.error(e);
  return;
}

for(var x=0;x<tasks.length;x++){
  var task = require('./.gulp/Tasks/' + tasks[x] + '/' + tasks[x]);
  gulp.task(tasks[x].toLowerCase(),task);
}*/