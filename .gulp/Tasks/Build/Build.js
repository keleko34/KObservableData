var base = require('./../../Base')
  , gulp = require('gulp')
  , modify = require('gulp-modify')
  , inject = require('gulp-inject')
  , sort = require('sort-stream')
  , replace = require('gulp-replace')
  , file = require('gulp-file')
  , beautify = require('js-beautify').js_beautify
  , closureCompiler = require('gulp-closure-compiler')
  , fs = require('fs');

module.exports = function()
{
    var masterSubs = [];
    
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

    function injector(oem,pathTo,name,subfiles,count,cb,sb)
    {
        console.log("building and injecting file: ",subfiles[count]);
        build(oem,subfiles[count],function(p,n){
            gulp.src(oem+'/Build/'+name+'.js')
            .pipe(inject(gulp.src(oem+'/Build/'+n+'.js'),{
                removeTags:true,
                starttag: '/* Build */',
                endtag: '/* End Build */',
                transform: function(filepath,file,i,length){
                    var contents = file.contents.toString('utf8');
                    if((count+1) !== subfiles.length) contents += '\r\n/* Build */\r\n/* END BUILD */';
                    return contents;
                }
            }))
            .pipe(gulp.dest(oem+'/Build'))
            .on('end',function(){
                count += 1;
                console.log(count,subfiles.length);
                if(count === subfiles.length)
                {
                    return cb(pathTo,name);
                }
                
                injector(oem,pathTo,name,subfiles,count,cb,sb);
            })
        },sb);
    }

    function build(oem,path,cb,sb)
    {
        var reD = /(define)(.*)(function\()(.*)(\))(.*)(?:{)/,
            reD2 = /(define)(.*)(function\()(.*)(\))/,
            reE = /\}\)(?![\s\S]*}\))/m,
            reM = /(define\()(\[(.*?)\])/,
            name = path.substring((path.lastIndexOf("/")+1),path.lastIndexOf(".")),
            pathTo = path.replace(name+".js",""),
            subFiles = [];

        if(!sb) sb = "";

        console.log("name: ",name, "dest: ",oem+'/Build');

        return gulp.src(path).pipe(modify({
            fileModifier: function(file, contents){
                var subModules = contents.match(reM)[0].replace(reM,"$3").replace(/\"/g,'').replace(/\'/g,'').split(',').filter(function(v){
                    return (v.length !== 0);
                }),
                subList = (sb.length !== 0 ? sb.split('.') : []);

                console.log("SubModules: ",subModules);

                subFiles = subModules.map(function(file){
                    if(file.indexOf('.') === -1 && file.indexOf('/') === -1){
                        //we have a bower or node_module
                        var module_path = tryBower(file);
                        if(module_path){
                            return global.gulp.base+module_path;
                        }
                    }
                    if(file.indexOf('.') === 0){
                        //we have a localized file
                        var local = path.substring(0,path.lastIndexOf('/')),
                            filePath = local+file.substring(1,file.length)+(file.indexOf('.',1) === -1 ? '.js' : '');

                        try{
                            var fstat = fs.statSync(filePath);
                            if(fstat.isFile())
                            {
                                return filePath;
                            }
                        }
                        catch(e){
                            console.error("No file exists as: ",filePath);
                        }
                    }
                    return "";
                }).filter(function(file){
                    var allowed = true;
                    if(sb.length !== 0){
                        var sp = sb.split(".");

                        function rec(subs,l)
                        {
                            console.log(subs,l);
                            var subList = subs[parseInt(l[0])];
                            if(subList.indexOf(file) !== -1){
                                allowed = false;
                            }
                            else{
                                l.splice(0,1);
                                if(l.length !== 0) rec(subList,l);
                            }
                        }
                        rec(masterSubs,sp);
                    }
                    return (file.length !== 0 && allowed);
                });
                
                var pushSub = subList.reduce(function(m,v){
                    return m[parseInt(v)];
                },masterSubs);
                
                if(subFiles.length !== 0){
                    sb += (sb.length !== 0 ? "." : "")+(pushSub.length);
                    pushSub.push(subFiles.slice());
                }

                console.log("subFiles: ",subFiles, subFiles.length);
                return contents;
            }
        }))
        .pipe(replace(reE,"}())"))
        .pipe(replace(reD,("var Create"+name+" = (function(){")))
        .pipe(replace(reD2,("var Create"+name+" = (function()")))
        .pipe(gulp.dest(oem+'/Build'))
        .on('end',function(){
            if(subFiles.length === 0){
                console.log("No Sub files on: ",name);
                return gulp.src(oem+'/Build/'+name+".js")
                .pipe(replace(/(\/\* Build)([\s\S]*?)(End Build \*\/)/,""))
                .pipe(gulp.dest(oem+'/Build'))
                .on('end',function(){
                    return cb(pathTo,name);
                });
            }
            
            injector(oem,pathTo,name,subFiles,0,cb,sb); 
        });
    }

    function Command(res)
    {
        console.log('\033[36mStarting to compile module:\033[37m',res.Component);

        return build(global.gulp.base+'/'+res.Component,global.gulp.base+'/'+res.Component+'/'+res.Component+'.js',function(p,n){
            console.log('\033[36mRunning clojure compiler minification:\033[37m');

            gulp.src(p+'Build/'+n+'.js')
            .pipe(modify({
                fileModifier: function(file,contents){
                    return beautify(contents);
                }
            }))
            .pipe(replace(/^\s*[\r\n]/gm,""))
            .pipe(gulp.dest('./'+res.Component+'/Build'))
            .pipe(closureCompiler({
                compilerPath:"./compiler.jar",
                fileName:res.Component+".min.js"
            }))
            .pipe(gulp.dest('./'+res.Component+'/Min'));
        })
        
        
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

        
    }

    return base
    .task('Build')
    .filter(Exists)
    .command(Command)
    .call();
}