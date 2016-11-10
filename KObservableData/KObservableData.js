/* Build */
/* End Build */

define(['KObservableArray','KObservableObject'],function(KArray,KObject)
{
    /* Notes */
    // this library is the 
    // props should be able to be scopeStrings
    // events should include localized scope object as well
    // child listener needs attached to every object and array

    function CreateKObservableData(name)
    {
        var _name = {name:name}
            _data = KObject().addPointer(_name,'name','__kbname');
        
        function eventObject()
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = objarr;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.name = objarr.__kbname;
            this.root = objarr.__kbref;
            this.scope = objarr.__kbscopeString;
            this.parent = objarr.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
        }

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
            return (Object.getOwnPropertyDescriptor(obj,prop).vaue === undefined);
        }

        function parsescopeString(str)
        {
            return str.split('.').filter(function(s){return (s.length !== 0);});
        }

        function getScope(str)
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
                    return getLayer(obj[str[0]]);
                }
            }

            return (str.length !== 0 ? getLayer(_data[str[0]]) : _data);
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

                for(var x=0,len=children.length;x<children;x++)
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

                for(var x=0,len=children.length;x<children;x++)
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

        function parseData(data,layer)
        {
            function parseLayer(dLayer,d)
            {
                var currLayerKeys = Object.keys(d),
                    currLayer,
                    currScope = '',
                    newdata;

                for(var x=0,len=currLayerKeys.length;x<len;x++)
                {
                    currLayer = d[currLayerKeys[x]];
                    if(isObject(currLayer) || isArray(currLayer))
                    {
                        currScope = dLayer.__kbscopeString+(dLayer.__kbscopeString.length !== 0 ? "." : "")+currLayerKeys[x];
                        if(isObservable(currLayer))
                        {
                            newdata = currLayer;
                            dLayer.addPointer(currLayerKeys[x],newdata);
                        }
                        else
                        {
                            newdata = (isObject(currLayer) ? KObject(_name.name,dLayer,currScope) : KArray(_name.name,dLayer,currScope));
                            dLayer.add(currLayerKeys[x],newdata);
                            dLayer[currLayerKeys[x]].addPointer(dLayer,'__kbname')
                            .prototype('isArray',isArray)
                            .prototype('isObject',isObject)
                            .prototype('isObservable',isObservable)
                            .prototype('updateName',updateName)
                            .prototype('getScopeByScopeString',getScope)
                            .prototype('addChildDataListener',addChildListener('__kbparentlisteners'))
                            .prototype('removeChildDataListener',removeChildListener('__kbparentlisteners'))
                            .prototype('addChildDataUpdateListener',addChildListener('__kbparentupdatelisteners'))
                            .prototype('removeChildDataUpdateListener',removeChildListener('__kbparentupdatelisteners'));

                            parseLayer(dLayer[currLayerKeys[x]],currLayer);
                        }
                    }
                    else
                    {
                        dLayer.add(currLayerKeys[x],currLayer);
                    }
                }
            }

            parseLayer((layer || _data),data);
        }


        _data.prototype('updateName',function(v){
            if(typeof v === 'string') _name.name = v;
            return this;
        })
        .prototype('isArray',isArray)
        .prototype('isObject',isObject)
        .prototype('isObservable',isObservable)
        .prototype('updateName',updateName)
        .prototype('getScopeByScopeString',getScope)
        .prototype('addChildDataListener',addChildListener('__kbparentlisteners'))
        .prototype('removeChildDataListener',removeChildListener('__kbparentlisteners'))
        .prototype('addChildDataUpdateListener',addChildListener('__kbparentupdatelisteners'))
        .prototype('removeChildDataUpdateListener',removeChildListener('__kbparentupdatelisteners'));

        return _data;
    }








    /* old code */
    function CreateKObservableData(name)
    {
        var _data = KObject(name),
            _name = name,
            _actions = {
                add:[],
                set:[],
                update:[],
                remove:[]
            },
            _onaction = function(objarr,key,type,value,oldValue,args)
            {
                var e = new eventObject(objarr,key,type,value,oldValue,args);

                for(var x=0,_curr=_actions[type],len=_curr.length;x!==len;x++)
                {
                    _curr[x](e);
                    if(e._stopPropogration) break;
                }
                return e._preventDefault;
            },
            _subscribers = {},
            _onset = function(objarr,key,action,value,oldValue)
            {
              var e = new eventObject(objarr,key,action,value,oldValue);
              KObservableData.onset(e);
              return e._preventDefault;
            },
            _onupdate = function(objarr,key,action,value,oldValue)
            {
              var e = new eventObject(objarr,key,action,value,oldValue);
              KObservableData.onupdate(e);
              return e._preventDefault;
            },
            _onadd = function(objarr,key,action,value,oldValue)
            {
              var e = new eventObject(objarr,key,action,value,oldValue);
              KObservableData.onadd(e);
              return e._preventDefault;
            },
            _onremove = function(objarr,key,action,value,oldValue)
            {
              var e = new eventObject(objarr,key,action,value,oldValue);
              KObservableData.onremove(e);
              return e._preventDefault;
            }

        function eventObject(objarr,key,action,value,oldValue,args)
        {
            this.stopPropogation = function(){this._stopPropogration = true;}
            this.preventDefault = function(){this._preventDefault = true;}
            this.local = objarr;
            this.key = key;
            this.arguments = args;
            this.type = action;
            this.name = objarr.__kbname;
            this.root = objarr.__kbref;
            this.scope = objarr.__kbscopeString;
            this.parent = objarr.___kbImmediateParent;
            this.value = value;
            this.oldValue = oldValue;
        }

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
            return (Object.getOwnPropertyDescriptor(obj,prop).vaue === undefined);
        }

        function parsescopeString(str)
        {
            return str.split(".").filter(function(v){
                return (v.length !== 0);
            });
        }

        function getScope(scopestring)
        {
            var str = parsescopeString(scopestring);
            function local(next)
            {
                var lc = next[str[0]];
                str.splice(0,1);
                if(str.length !== 0) return local(lc,str[0]);

                return lc;
            }
            return local(_data);
        }

        /* parses data and returns data as observables with parent attachable properties */
        function parseData(parent,prop,data)
        {
            function parse(parent,prop,data)
            {
                var nData = (isObject(data) ? KObject(_name,parent,parent.__kbscopeString+"."+prop) : KArray(_name,parent,parent.__kbscopeString+"."+prop)),
                    props = Object.keys(data);

                if(Object.keys(parent.__kbparentlisteners).length !== 0) nData.__kbparentlisteners = parent.__kbparentlisteners;
                if(Object.keys(parent.__kbparentupdatelisteners).length !== 0) nData.__kbparentupdatelisteners = parent.__kbparentupdatelisteners;

                
                Object.defineProperties(nData,{
                  addChildListener:setDescriptor(addChildListener("__kbparentlisteners")),
                  removeChildListener:setDescriptor(removeChildListener("__kbparentlisteners")),
                  addChildUpdateListener:setDescriptor(addChildListener("__kbparentupdatelisteners")),
                  removeChildUpdateListener:setDescriptor(removeChildListener("__kbparentupdatelisteners"))
                });

                for(var x=0,val = undefined,len=props.length;x<len;x++)
                {
                    val = data[props[x]];
                    if(isObject(val) || isArray(val))
                    {
                        val = parse(nData,props[x],val);
                    }
                    nData.add(props[x],val);
                }
                return nData;
            }
            return parse(parent,prop,data);
        }

        /* add scopestring */
        function add(prop,value)
        {
            if(_data[prop] === undefined)
            {
                if(_onadd(_data,prop,'add',value) !== true)
                {
                    if(isObject(value) || isArray(value))
                    {
                        _data.add(prop,parseData(_data,prop,value));
                    }
                    else
                    {
                        _data.add(prop,value);
                    }
                    _onaction(_data, prop, 'add', value,undefined,arguments);
                }
            }
            else
            {
                console.error('Your attempting to add the property: ',prop,' that already exists on',_data,'try using set instead');
            }
            return this;
        }

        /* add scopestring */
        function addPointer(objarr,prop)
        {
            if(_onadd(_data,prop,'add',objarr[prop]) !== true)
            {
                _data.addPointer(objarr,prop);
                _onaction(_data, prop, 'add', value,undefined,arguments);
            }
            return this;
        }

        /* add scopestring */
        function set(prop,value,stopChange)
        {
            if(_data[prop] === undefined)
            {
                add(prop,value);
            }
            else
            {
                if(_onset(_data, prop, 'set' ,value) !== true)
                {
                    _data.set(prop,value,stopChange);
                    _onaction(_data, prop,'set',value,old,arguments);
                }
            }
            return this;
        }

        /* add scopestring */
        function remove(prop)
        {
            if(_data[prop] === undefined)
            {
                console.error('Your attempting to remove the property: ',prop,' that does not exist on ',_data);
                return this;
            }
            if(_onremove(_data,prop,'remove',_data[prop]) !== true)
            {
                _data.remove(prop);
            }
            return this;
        }

        function stringify()
        {
            return _data.stringify();
        }

        /* these need ability for scopestrings */
        function addListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                _listeners[prop] = func;
                return this;
            }
        }

        function removeListener(type)
        {
            var _listeners = this[type];
            return function(prop,func)
            {
                if(func !== undefined) _listeners = _listeners[prop];

                for(var x=0,len=_listeners.length;x<len;x++)
                {
                    if(_listeners[x].toString() === func.toString())
                    {
                        _listeners.splice(x,1);
                        return this;
                    }
                }
                return this;
            }
        }

        /* add these to all children as well and use scopestring process */
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

                for(var x=0,len=children.length;x<children;x++)
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

                for(var x=0,len=children.length;x<children;x++)
                {
                  recRemoveListener(children[x],prop,func);
                }
              }

              recRemoveListener(this,prop,func);
              return this;
            }
        }

        function subscribe(prop,func)
        {
            var pScopeString = parsescopeString(prop)
            if(pScopeString.length !== 1)
            {
                var objarr = getScope(prop);
                objarr.subscribe(pScopeString[(pScopeString.length-1)],func);
            }
            else
            {
                _data.subscribe(prop,func);
            }
            return this;
        }

        function unsubscribe(prop,func)
        {
          var pScopeString = parsescopeString(prop);
          if(pScopeString.length !== 1)
          {
              var objarr = getScope(prop);
              objarr.unsubscribe(pScopeString[(pScopeString.length-1)],func);
          }
          else
          {
              _data.unsubscribe(prop,func);
          }
          return this;
        }

        function callSubscribers(prop,value,oldValue)
        {
            if(_subscribers[prop] !== undefined)
            {
                var e = new eventObject(_data,prop,'subscriber',value,oldValue);
                for(var x=0,len=_subscribers[prop].length;x<len;x++)
                {
                    _subscribers[prop][x](e);
                    if(e._stopPropogration) break;
                }
            }
            return this;
        }

        function setDescriptor(value,writable)
        {
            return {
                value:value,
                writable:!!writable,
                enumerable:false,
                configurable:false
            }
        }

        function data()
        {
          return _data;
        }

        /* if data is passed change _data type, also update _name if passed as well */
        function KObservableData(data,name)
        {
          if(name !== undefined && typeof name === 'string') _name = name;
          if(data !== undefined)
          {
            _data = (isObject(data) ? KObject(_name) : (isArray(data) ? KArray(_name) : _data)),
            _dKeys = Object.keys(data);

            Object.defineProperties(_data,{
              addChildListener:setDescriptor(addChildListener("__kbparentlisteners")),
              removeChildListener:setDescriptor(removeChildListener("__kbparentlisteners")),
              addChildUpdateListener:setDescriptor(addChildListener("__kbparentupdatelisteners")),
              removeChildUpdateListener:setDescriptor(removeChildListener("__kbparentupdatelisteners"))
            });

            for(var x=0,prop=undefined,len=_dKeys.length;x<len;x++)
            {
              prop = data[_dKeys[x]];
              if(isOBject(prop) || isArray(prop))
              {
                  _data.add(_dKeys[x],parseData(_data,_dKeys[x],prop));
              }
              else
              {
                _data.add(_dKeys[x],prop);
              }
            }
          }
          return this;
        }


        Object.defineProperties(KObservableData,{
          onadd:setDescriptor(function(){},true),
          onremove:setDescriptor(function(){},true),
          onset:setDescriptor(function(){},true),
          onupdate:setDescriptor(function(){},true),
          data:setDescriptor(data),
          subscribe:setDescriptor(subscribe),
          unsubscribe:setDescriptor(unsubscribe),
          callSubscribers:setDescriptor(callSubscribers),
          add:setDescriptor(add),
          addPointer:setDescriptor(addPointer),
          set:setDescriptor(set),
          remove:setDescriptor(remove),
          stringify:setDescriptor(stringify),
          isObservable:setDescriptor(isObservable),
          isObject:setDescriptor(isObject),
          isArray:setDescriptor(isArray),
          addListener:setDescriptor(addListener),
          removeListener:setDescriptor(removeListener),
          __kbname:setDescriptor(_name,true),
          __kbref:setDescriptor(_data,true),
          __kblisteners:setDescriptor({}),
          __kbupdatelisteners:setDescriptor({}),
          __kbparentlisteners:setDescriptor({}),
          __kbparentupdatelisteners:setDescriptor({}),
          __kbdatacreatelisteners:setDescriptor([]),
          __kbdatadeletelisteners:setDescriptor([]),
          addActionListener:setDescriptor(addActionListener),
          removeActionListener:setDescriptor(removeActionListener)
        });

        Object.defineProperties(_obj,{
            addDataListener:setDescriptor(addListener('__kblisteners')),
            removeDataListener:setDescriptor(removeListener('__kblisteners')),
            addDataUpdateListener:setDescriptor(addListener('__kbupdatelisteners')),
            removeDataUpdateListener:setDescriptor(removeListener('__kbupdatelisteners')),
            addDataCreateListener:setDescriptor(addListener('__kbdatacreatelisteners')),
            removeDataCreateListener:setDescriptor(removeListener('__kbdatacreatelisteners')),
            addDataRemoveListener:setDescriptor(addListener('__kbdatadeletelisteners')),
            removeDataRemoveListener:setDescriptor(removeListener('__kbdatadeletelisteners'))
        });

        return KObservableData;
    }
    return CreateKObservableData;
})