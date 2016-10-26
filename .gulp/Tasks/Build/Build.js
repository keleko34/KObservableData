var base = require('./../../Base')
  , gulp = require('gulp')
  , modify = require('gulp-modify')
  , inject = require('gulp-inject')
  , sort = require('sort-stream')
  , replace = require('gulp-replace')
  , file = require('gulp-file')
  , closureCompiler = require('gulp-closure-compiler')
  , fs = require('fs');

module.exports = function()
{
    
    function Exists(res,key){
        if(res.Component !== undefined){
            try
            {
                var exists = fs.statSync('./'+res.Component+'/'+res.Component+'.js');
                if(!exists){
                    console.error('\033[31mYour missing a main js file by the same name:\033[37m ',res.Component);
                    process.exit(1);
                }
            }
            catch(e)
            {
                if(e.code !== 'ENOENT'){
                    console.error(e);
                    process.exit(1);
                }
            }
        }
    }

    function tryBower(name)
    {
        try
        {
            var fstat = fs.statSync(global.gulp.base+'/bower_components/'+name);
            if(fstat.isDirectory())
            {
                var main = JSON.parse(fs.readFileSync(global.gulp.base+"/bower_components/"+name+"/bower.json")).main;
                return "/bower_components/"+url+"/"+main;
            }
            else
            {
                return tryNode(name);
            }
        }
        catch(e)
        {
            return tryNode(name);
        }
    }

    function tryNode(name)
    {
        try
        {
            var fstat = fs.statSync(global.gulp.base+'/node_modules/'+name);
            if(fstat.isDirectory())
            {
                return "/node_modules/"+name+"/"+name+"/"+name+".js";
            }
        }
        catch(e)
        {
            return null;
        }
    }

    function build(path)
    {
        var reD = /(define)(.*)(function\()(.*)(\))(.*)(?:{)/,
            reE = /\}\)(?![\s\S]*}\))/m,
            reM = /(define\()(\[(.*?)\])/,
            g = gulp.src(path),
            subGulps = [];

        return g.pipe(modify({
            fileModifier: function(file, contents){
                var subModules = contents.match(reM)[0].replace(reM,"$3").replace(/\"/g,'').replace(/\'/g,'').split(',').filter(function(v){
                    return (v.length !== 0);
                }),
                subFiles = subModules.map(function(file){
                    if(file.indexOf('.') === -1 && file.indexOf('/') === -1){
                        //we have a bower or node_module
                        var path = tryBower(file);
                        if(path){
                            return global.gulp.base+path;
                        }
                    }
                    if(file.indexOf('.') === 0){
                        //we have a localized file
                        var local = path.substring(0,path.lastIndexOf('/')),
                            filePath = local+file.substring(1,file.length)+(file.indexOf('.',1) === -1 ? '.js' : '');
                        console.log(filePath);
                        try{
                            var fstat = fs.statSync(global.gulp.base+filePath);
                            if(fstat.isFile())
                            {
                                return global.gulp.base+filePath;
                            }
                        }
                        catch(e){
                            console.error("No file exists as: ",filePath);
                        }
                    }
                    return "";
                }).filter(function(file){
                    return (file.length !== 0);
                });

                console.log(subFiles);

                subFiles.forEach(function(file){
                    console.log("building and injecting file: ",file);
                    g.pipe(inject(build(file),{
                        starttag: '/* BUILD */',
                        endtag: '/* END BUILD */',
                        transform: function(filepath,file,i,length){
                            var contents = file.contents.toString('utf8');
                            console.log('altering main',filepath);
                            return contents;
                        }
                    }));
                });
                return contents;
            }
        }));
    }

    function Command(res)
    {
        console.log('\033[36mStarting to compile module:\033[37m',res.Component);

        var reD = /(define)(.*)(function\()(.*)(\))(.*)(?:{)/,
            reE = /\}\)(?![\s\S]*}\))/m;

        build(global.gulp.base+'/'+res.Component+'/'+res.Component+'.js')
        .pipe(replace(reE,"}())"))
        .pipe(replace(reD,("var Create"+res.Component+" = (function(){")))
        .pipe(gulp.dest('./'+res.Component+'/Build'));
        
        /*
        gulp.src('./'+res.Component+'/'+res.Component+'.js')
        .pipe(inject(subFiles,{
            relative:true, */
            //starttag: '/* BUILD */',
            //endtag: '/* END BUILD */',
            /*transform: function(filepath,file,i,length)
            {
                if(ignorePath.indexOf('./'+filepath) !== -1)
                {
                    console.log('\033[36mInjecting File:\033[37m',filepath);
                    var contents = file.contents.toString('utf8'),
                        re = /(function Create)(.*)(\()/;
                    var module = 'Create'+re.exec(contents)[2],
                        subModules = contents.match(reM)[0].replace(reM,"$3").replace(/\"/g,'').replace(/\'/g,'').split(','),
                        subModulesContent = subModules.map(function(file){
                            if(file.indexOf('.') === -1 && file.indexOf('/') === -1){
                                //we have a bower or node_module

                            }
                            else if(file.indexOf('.') === -1 && file.indexOf('/') !== -1){
                                //we have a globalized file

                            }
                            else if(file.indexOf('.') !== -1){
                                //we have a localized file
                            }
                        });
                    

                    console.log(subModules);

                    contents = contents.replace(reE,"}());");
                    contents = contents.replace(reD,"var "+module+" = (function(){");
                    return contents;
                }
                else
                {
                    return "";
                }
            },
            ignorePath:ignorePath
        }))
        .pipe(replace(reE,"}())"))
        .pipe(replace(reD,("var Create"+res.Component+" = (function(){")))
        .pipe(gulp.dest('./'+res.Component+'/Build'));

        */

        console.log('\033[36mRunning clojure compiler minification:\033[37m');
        gulp.src('./'+res.Component+'/Build/'+res.Component+'.js')
        .pipe(closureCompiler({
            compilerPath:"./compiler.jar",
            fileName:res.Component+".min.js"
        }))
        .pipe(gulp.dest('./'+res.Component+'/Min'));
    }

    return base
    .task('Build')
    .filter(Exists)
    .command(Command)
    .call();
}