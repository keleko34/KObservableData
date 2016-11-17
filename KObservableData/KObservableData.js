/* Build */
/* End Build */

define(['KObservableArray','KObservableObject'],function(KArray,KObject)
{
    /* Notes */
    // overwrite add,set,remove, all listeners to allow for scopestrings, events get localized
    // rework how the object and array events work

    /* Main */
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
                    return getLayer(obj[str[0]]);
                }
            }

            return (str && str.length !== 1 ? getLayer(obj[str[0]]) : (str && str.length ? obj[str[0]] : obj));
        }

        function routeListener(a)
        {
            var sp = a.key.split('.');
            if(sp.length === 1)
            {
                a.preventDefault();
                return false;
            }
            getScope(a.event.local,a.key)[a.type](a.key,a.args[1]);
        }

        function overwrite(objarr)
        {
            objarr.prototype('isArray',isArray)
            .prototype('isObject',isObject)
            .prototype('isObservable',isObservable)
            .prototype('updateName',updateName)
            .prototype('getScopeByScopeString',getScope)
            .prototype('addChildDataListener',addChildListener('__kbparentlisteners'))
            .prototype('removeChildDataListener',removeChildListener('__kbparentlisteners'))
            .prototype('addChildDataUpdateListener',addChildListener('__kbparentupdatelisteners'))
            .prototype('removeChildDataUpdateListener',removeChildListener('__kbparentupdatelisteners'))
            .addActionListener('addDataListener',routeListener)
            .addActionListener('addDataUpdateListener',routeListener)
            .addActionListener('addDataCreateListener',routeListener)
            .addActionListener('addDataDeleteListener',routeListener)
            .addActionListener('removeDataListener',routeListener)
            .addActionListener('removeDataUpdateListener',routeListener)
            .addActionListener('removeDataCreateListener',routeListener)
            .addActionListener('removeDataDeleteListener',routeListener);
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
                            overwrite(dLayer);
                        }
                        else
                        {
                            newdata = (isObject(currLayer) ? KObject(_name.name,dLayer,currScope) : KArray(_name.name,dLayer,currScope));
                            dLayer.add(currLayerKeys[x],newdata);
                            dLayer[currLayerKeys[x]].addPointer(dLayer,'__kbname');

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
        });

        overwrite(_data);

        return _data;
    }
    return CreateKObservableData;
})