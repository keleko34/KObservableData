/* Build */
/* End Build */

define(['KObservableArray','KObservableObject'],function(KArray,KObject)
{
    /* Notes */
    // props should be able to be scopeStrings
    // events should include localized scope object as well
    // child listener needs attached to every object and array

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
                  addChildListener:setDescriptor(addChildListener),
                  removeChildListener:setDescriptor(removeChildListener)
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

        function addListener(prop,func)
        {

        }

        function removeListener(prop,func)
        {

        }

        /* add these to all children as well and use scopestring process */
        function addChildListener(prop,func)
        {

        }

        function removeChildListener(prop,func)
        {

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
            _data = (isObject(data) ? KObject(_name) : (isArray(data) ? KArray(_name) : _data);
          }
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
          removeActionListener:setDescriptor(removeActionListener),
          addChildListener:setDescriptor(addChildListener),
          removeChildListener:setDescriptor(removeChildListener)
        });

        return KObservableData;
    }
    return CreateKObservableData;
})