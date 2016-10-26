var base = require('./../../Base')
  , query = require('querystring')
  , fs = require('fs')
  , connect = require('gulp-connect');

var settings = global.gulp,
    config = settings.config,
    ignore = config.ignore,
    builds = fs.readdirSync(settings.base).filter(function(file){
        return (fs.statSync(settings.base+"/"+file).isDirectory() && ignore.indexOf(file) === -1);
    });

module.exports = function()
{
    function route(req,res,next)
    {
        var url = req.url.substring(1,req.url.length);
        if(req.url.substring(0,(req.url.indexOf('?') !== -1 ? req.url.indexOf('?') : req.url.length)) === '/'){
            req.url = '/test/index.html';
        }
        else if(req.url.indexOf('/') === 0 && req.url.substring(1,req.url.length).indexOf('/') === -1)
        {
            function tryBower(url)
            {
                try
                {
                    var fstat = fs.statSync(settings.base+'/bower_components/'+url);
                    if(fstat.isDirectory())
                    {
                        var main = JSON.parse(fs.readFileSync(settings.base+"/bower_components/"+url+"/bower.json")).main;
                        req.url = "/bower_components/"+url+"/"+main;
                    }
                    else
                    {
                        tryNode(url);
                    }
                }
                catch(e)
                {
                    tryNode(url);
                }
            }

            function tryNode(url)
            {
                try
                {
                    var fstat = fs.statSync(settings.base+'/node_modules/'+url);
                    if(fstat.isDirectory())
                    {
                        req.url = "/node_modules/"+url+"/"+url+"/"+url+".js";
                    }
                }
                catch(e)
                {

                }
            }

            tryBower((req.url.indexOf('.') !== -1 ? req.url.substring(1,req.url.indexOf('.')) : req.url.substring(1,req.url.length)));
        }
        else
        {
            for(var x=0,len=builds.length;x<len;x++)
            {
                if(req.url.indexOf(builds[x]))
                {
                    var q = query.parse(req.url.substring((req.url.indexOf('?')+1),req.url.length));
                    if(q.env)
                    {
                        if(q.env.toLowerCase() === 'build')
                        {
                            req.url = '/'+builds[x]+'/Build/'+builds[x]+'.js';
                        }
                        else if(q.env.toLowerCase() === 'min')
                        {
                            req.url = '/'+builds[x]+'/Min/'+builds[x]+'.min.js';
                        }
                    }
                }
            }
        }
        return next();
    }

    function Command(res)
    {
        connect.server({
        root: (res.root && res.root.length !== 0 ? res.root : '.'),
        livereload: false,
        port:(res.port && res.port.length !== 0 ? parseInt(res.port) : 8080),
        middleware:function(connect, opt){
            return [route]
            }
        });
    }

    return base
    .task('Server')
    .command(Command)
    .call();
}