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
      
        function actionObject(type,prop,ev,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.type = type;
            this.key = prop;
            this.event = ev;
            this.args = args;
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

        function setScope(obj,str,val)
        {
          str = parsescopeString(str);
          function setLayer(obj)
          {
            str.splice(0,1);
            if(str.length === 1)
            {
                obj[str[0]] = val;
            }
            else
            {
                setLayer(obj[str[0]]);
            }
          }

          if(str && str.length !== 1)
          {
            setLayer(obj[str[0]]);
          }
          else if(str && str.length)
          {
            obj[str[0]] = val;
          }
          return this;
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

        function routeSubscriber(a)
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
                var children = Object.keys(a.event.local).filter(function(p){
                    return (isObject(a.event.local[p]) || isArray(a.event.local[p]));
                });

                for(var x=0,len=children.length;x<len;x++)
                {
                    a.event.local[children[x]].subscribe(a.key,a.args[1]);
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
            if(objarr.setScopeByScopeString === undefined) objarr.prototype('setScopeByScopeString',setScope);
            if(objarr.addChildDataListener === undefined) objarr.prototype('addChildDataListener',addChildListener('__kbparentlisteners'));
            if(objarr.removeChildDataListener === undefined) objarr.prototype('removeChildDataListener',removeChildListener('__kbparentlisteners'));
            if(objarr.addChildDataUpdateListener === undefined) objarr.prototype('addChildDataUpdateListener',addChildListener('__kbparentupdatelisteners'));
            if(objarr.removeChildDataUpdateListener === undefined) objarr.prototype('removeChildDataUpdateListener',removeChildListener('__kbparentupdatelisteners'));
            if(objarr.setUnobservable === undefined) objarr.prototype('setUnobservable',setUnobservable);
            if(objarr.addUnobservable === undefined) objarr.prototype('addUnobservable',addUnobservable);

            return objarr.addActionListener('add',addData)
            .addActionListener('set',setData)
            .addActionListener('subscribe',routeSubscriber)
            .addActionListener('unsubscribe',routeSubscriber)
            .addActionListener('addDataListener',routeListener)
            .addActionListener('addDataUpdateListener',routeListener)
            .addActionListener('addDataCreateListener',routeListener)
            .addActionListener('addDataRemoveListener',routeListener)
            .addActionListener('removeDataListener',routeListener)
            .addActionListener('removeDataUpdateListener',routeListener)
            .addActionListener('removeDataCreateListener',routeListener)
            .addActionListener('removeDataRemoveListener',routeListener)
            .addDataUpdateListener('*',function(e){
                if(!this._stopChange)
                {
                  setData(new actionObject('set',e.key,e,[e.value]));
                }
                else
                {
                  this._stopChange = false;
                }
            
            });
          
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
                  recAddListener(objarr[children[x]],prop,func);
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
                  recRemoveListener(objarr[children[x]],prop,func);
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
      
        function setUnobservable(key,value)
        {
          this.stopChange()[key] = value;
          return this;
        }
      
        function addUnobservable(key,value)
        {
          if(this[key] === undefined)
          {
            this[key] = value;
          }
          else
          {
            console.error('');
          }
        }

        //these take care of recursion for us
        function addData(a)
        {
            if(isObject(a.event.value) || isArray(a.event.value))
            {
                if(!isObservable(a.event.value))
                {
                    a.preventDefault();
                    var local = a.event.local,
                        str = local.__kbscopeString+(local.__kbscopeString.length !== 0 ? '.' : '')+a.key,
                        builder = (isObject(a.event.value) ? KObject : KArray)(local.__kbname,local,str);
                    
                    overwrite(builder).parseData(a.event.value);
                    if(local[a.key] === undefined)
                    {
                      local.add(a.key,builder);
                    }
                    else if(isArray(local))
                    {
                      local.splice(a.key,0,builder);
                    }
                    else if(isObject(local))
                    {
                      local.set(a.key,builder);
                    }
                }
            }
        }

        function setData(a)
        {
            if(isObject(a.event.value) || isArray(a.event.value))
            {
                if(!isObservable(a.event.value))
                {
                    a.preventDefault();
                    var local = a.event.local,
                        str = local.__kbscopeString+(local.__kbscopeString.length !== 0 ? '.' : '')+a.key,
                        builder = (isObject(a.event.value) ? KObject : KArray)(local.__kbname,local,str);
                  
                    overwrite(builder).parseData(a.event.value);
                    local.set(a.key,builder);
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
