/* Build */
/* End Build */

define(['KObservableArray','KObservableObject'],function(KArray,KObject)
{
    /* Notes */
    // overwrite add,set,remove, all listeners to allow for scopestrings, events get localized
    // rework how the object and array events work

    //convert parseData into set and add

    /* Main */
    function CreateKObservableData(name,type)
    {
        var _name = {name:name},
            _type = (typeof type === 'string' && type.toLowercase() === 'array' ? KArray : KObject)
            _data = _type(_name.name,undefined,"").addPointer(_name,'name','__kbname');

        function isArray(v)
        {
            return (Object.prototype.toString.call(v) === "[object Array]");
        }

        function isObject(v)
        {
            return (Object.prototype.toString.call(v) === "[object Object]");
        }

        function isObservable(obj,prop)
        {
            if(!prop) return obj.__kbname !== undefined;
            return (obj[prop] ? Object.getOwnPropertyDescriptor(obj,prop).value === undefined : false);
        }

        function parsescopeString(str)
        {
            return str.split('.').filter(function(s){return (s.length !== 0);});
        }

        function getScope(obj,str)
        {
            str = parsescopeString(str);
            function getLayer(obj)
            {
                str.splice(0,1);
                if(str.length === 0)
                {
                    return obj;
                }
                else
                {
                    return (obj[str[0]] ? getLayer(obj[str[0]]) : obj);
                }
            }

            return (str && str.length !== 1 ? getLayer(obj[str[0]]) : (str && str.length ? obj[str[0]] : obj));
        }

        function routeListener(a)
        {
            var sp = a.key.split('.');
            if(sp.length === 1 && a.key !== '*')
            {
                return false;
            }
            if(a.key !== '*')
            {
                a.preventDefault();
                getScope(a.event.local,sp.slice(0,(sp.length-1)).join('.'))[a.type](sp[(sp.length-1)],a.args[1]);
            }
            else
            {
                a.preventDefault();
                if(a.type.toLowerCase().indexOf('update') !== -1)
                {
                    a.event.local.addChildDataUpdateListener('*',a.args[1]);
                }
                else
                {
                    a.event.local.addChildDataListener('*',a.args[1]);
                }
            }
        }

        function overwrite(objarr)
        {
            if(objarr.parseData === undefined) objarr.prototype('parseData',parseData);
            if(objarr.isArray === undefined) objarr.prototype('isArray',isArray);
            if(objarr.isObject === undefined) objarr.prototype('isObject',isObject);
            if(objarr.isObservable === undefined) objarr.prototype('isObservable',isObservable);
            if(objarr.updateName === undefined) objarr.prototype('updateName',updateName);
            if(objarr.getScopeByScopeString === undefined) objarr.prototype('getScopeByScopeString',getScope);
            if(objarr.addChildDataListener === undefined) objarr.prototype('addChildDataListener',addChildListener('__kbparentlisteners'));
            if(objarr.removeChildDataListener === undefined) objarr.prototype('removeChildDataListener',removeChildListener('__kbparentlisteners'));
            if(objarr.addChildDataUpdateListener === undefined) objarr.prototype('addChildDataUpdateListener',addChildListener('__kbparentupdatelisteners'));
            if(objarr.removeChildDataUpdateListener === undefined) objarr.prototype('removeChildDataUpdateListener',removeChildListener('__kbparentupdatelisteners'));

            return objarr.addActionListener('add',addData)
            .addActionListener('set',setData)
            .addActionListener('addDataListener',routeListener)
            .addActionListener('addDataUpdateListener',routeListener)
            .addActionListener('addDataCreateListener',routeListener)
            .addActionListener('addDataRemoveListener',routeListener)
            .addActionListener('removeDataListener',routeListener)
            .addActionListener('removeDataUpdateListener',routeListener)
            .addActionListener('removeDataCreateListener',routeListener)
            .addActionListener('removeDataRemoveListener',routeListener);
        }

        function addChildListener(type)
        {
            return function(prop,func)
            {
              function recAddListener(objarr,prop,func)
              {
                var children = Object.keys(objarr).filter(function(p){
                  return (isObject(objarr[p]) || isArray(objarr[p]));
                });

                if(objarr[type][prop] === undefined) objarr[type][prop] = [];

                objarr[type][prop].push(func);

                for(var x=0,len=children.length;x<len;x++)
                {
                  recAddListener(children[x],prop,func);
                }
              }

              recAddListener(this,prop,func);
              return this;
            }
        }

        function removeChildListener(type)
        {
            return function(prop,func)
            {
              function recRemoveListener(objarr,prop,func)
              {
                var children = Object.keys(objarr).filter(function(p){
                  return (isObject(objarr[p]) || isArray(objarr[p]));
                });
                
                loop:for(var i=0,lenI=objarr[type][prop].length;i<lenI;i++)
                {
                  if(objarr[type][prop][i].toString() === func.toString())
                  {
                      objarr[type][prop].splice(i,1);
                      break loop;
                  }
                }

                for(var x=0,len=children.length;x<len;x++)
                {
                  recRemoveListener(children[x],prop,func);
                }
              }

              recRemoveListener(this,prop,func);
              return this;
            }
        }

        function updateName(v)
        {
            if(typeof v === 'string') _name.name = v;
            return this;
        }

        //these take care of recursion for us, hehe
        function addData(a)
        {
            if(isObject(a.args[1]) || isArray(a.args[1]))
            {
                if(!isObservable(a.args[1]))
                {
                    a.preventDefault();
                    var local = a.event.local,
                        str = local.__kbscopeString+(local.__kbscopeString.length !== 0 ? '.' : '')+a.key,
                        builder = (isObject(a.args[1]) ? KObject : KArray)(local.__kbname,local,str);

                    local.add(a.key,builder);
                    overwrite(local[a.key]).parseData(a.args[1]);
                }
            }
        }

        function setData(a)
        {
            if(isObject(a.args[1]) || isArray(a.args[1]))
            {
                if(!isObservable(a.args[1]))
                {
                    a.preventDefault();
                    var local = a.event.local,
                        str = local.__kbscopeString+(local.__kbscopeString.length !== 0 ? '.' : '')+a.key,
                        builder = (isObject(a.args[1]) ? KObject : KArray)(local.__kbname,local,str);

                    local.set(a.key,builder);
                    overwrite(local[a.key]).parseData(a.args[1]);
                }
            }
        }

        function parseData(data)
        {
            for(var x=0,keys=Object.keys(data),len=keys.length;x<len;x++)
            {
                this.set(keys[x],data[keys[x]]);
            }
            return this;
        }

        overwrite(_data);

        return _data;
    }
    return CreateKObservableData;
})
