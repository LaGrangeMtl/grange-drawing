(function (root, factory) {
    var nsParts = 'lagrange/forms/AjaxRequest'.split('/');
    var name = nsParts.pop();
    var ns = nsParts.reduce(function(prev, part){
        return prev[part] = (prev[part] || {});
    }, root);

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('lagrange/forms/AjaxRequest', ['jquery'], factory);
    } else {
        // Browser globals
        ns[name] = factory(root.jQuery);
    }
}(this, function ($) {
    //==============================================================================
    //  AjaxRequest : Constructor function
    //
    //  @params : options : Object containing several settings necessary for the
    //                      well behavior of AjaxRequest. These settings are :
    //                      {
    //                          type: 'GET',
    //                          url: '',
    //                          dataType: 'JSON', // By default, is not set so that
    //                                                it uses the intelligent guess
    //                                                provided by jQuery
    //                          debugOnFailure: true,
    //                          onSuccess:this.onSuccess,
    //                          onFailure:this.onFailure,
    //                          beforeRequest:this.beforeRequest,
    //                          afterRequest:this.afterRequest      
    //                      }
    //==============================================================================
    var AjaxRequest = function(options){
        this.isPosting = false;

        this.init(options);
    };

    AjaxRequest.prototype = {
        //==========================================================================
        //  init : Itinialisation function. Set options using the user defined
        //          options and the default ones.
        //
        //  @params : options : Object passed by the constructor function
        //==========================================================================
        init:function(options){
            var _self = this;

            // Default values
            var defaultOptions = {
                type: 'GET',
                url: '',
                debugOnFailure: true,
                onSuccess:this.onSuccess,
                onFailure:this.onFailure,
                beforeRequest:this.beforeRequest,
                afterRequest:this.afterRequest
            };

            this.options = $.extend({}, defaultOptions, options);
        },

        //==========================================================================
        //  makeRequest : Main function of AjaxRequest to be called when we want to 
        //                 POST or GET data to/from a server.
        //
        //  @params : post : Post object usually representing values of a form. When
        //                    using AjaxForm, use AjaxForm.getPost() as post. 
        //
        //  @returns : afterPostDfd : $.Deferred() so that we can use it 
        //                            asynchronously and still know when it is done.
        //==========================================================================
        makeRequest:function(post){
            var _self = this;

            // Deactivate form while posting
            if(_self.isPosting === true){
                _self.deactivateForm();
                return;
            }
            
            _self.isPosting = true;
            var beforePostDfd = _self.options.beforeRequest();
            var postDfd = $.Deferred();
            var afterPostDfd = $.Deferred();
            var ajaxOptions = {};

            if(post !== undefined && _self.options.type.toUpperCase() !== 'POST'){
                console.log('Trying to GET, but parameter post is valid. Did you mean to POST?');
                return;
            }

            ajaxOptions.type = _self.options.type;
            ajaxOptions.url = _self.options.url;

            // If it is not set, means taht we let $.Ajax's intelligent guess do it
            if(_self.options.dataType !== undefined)
                ajaxOptions.dataType = _self.options.dataType;

            // POST Request only
            if(_self.options.type.toUpperCase() === 'POST')
               ajaxOptions.data = post;

            postDfd = $.ajax(ajaxOptions);
            
            $.when(postDfd, beforePostDfd).then(
                function(data){
                    _self.options.onSuccess(data);
                },
                function(data, textStatus){
                    if(_self.options.debugOnFailure)
                        _self.debugFailure(data, textStatus);

                    _self.options.onFailure();
                }
            ).always(function(){
                afterPostDfd = _self.options.afterRequest();

                afterPostDfd.done(function(){
                    _self.reactivateForm();
                });
            }); 

            return afterPostDfd;
        },

        //=====================================================================
        //  deactivateForm : Deactivates requesting while we are already doing it,
        //                   thus preventing double posts to database.
        //=====================================================================
        deactivateForm:function(){
            console.log('Warning : Cannot POST or GET right now because we are already sending a request to the server. The post function will reactivate after the request is completed.');
        },

        //===================================================================
        //  reactivateForm : Reactivates the form after posting is complete
        //===================================================================
        reactivateForm:function(){
            this.isPosting = false;
        },

        //=========================================================
        //  beforeRequest : Actions that are done before making a request.
        //
        //  This function can / should be overwritten, this
        //  function MUST return a $.Deferred()
        //
        //  @returns : dfd : $.Deferred()
        //=========================================================
        beforeRequest:function(){
            var dfd = $.Deferred();

            console.log("Do this before request");
            setTimeout(function(){
                dfd.resolve();
            }, 2000);

            return dfd;
        },

        //===================================================================
        //  afterRequest : Actions that are done after the request, regardless
        //                 of the result of the request.
        //
        //  This function can / should be overwritten, this
        //  function MUST return a $.Deferred()
        //
        //  @returns : dfd : $.Deferred()
        //===================================================================
        afterRequest:function(){
            var dfd = $.Deferred();
            console.log("Do this after request");
            
            dfd.resolve();
            return dfd;
        },

        //====================================================
        //  onSuccess : Called upon success of the request.
        //
        //  This function can / should be overwritten.
        //====================================================
        onSuccess:function(data){
            var _data = data[0];
            console.log(_data);
        },

        //====================================================
        //  onFailure : Called upon success of the request.
        //
        //  This function can / should be overwritten.
        //====================================================
        onFailure:function(){
            console.log("Do this after failure");
        },

        //==================================================================
        //  debugFailure : Called upon failure of the request.
        //
        //  This function is by default mapping errors and logging them.
        //  This behavior can be changed by setting options.debugOnFailure 
        //  to false. Logs the error in the console.
        //
        //  @params : x : Request object
        //
        //  @params : exception : Exception object
        //==================================================================
        debugFailure:function(x, exception){
            var message;
            var statusErrorMap = {
                '400' : "Server understood the request but request content was invalid.",
                '401' : "Unauthorised access.",
                '403' : "Forbidden resouce can't be accessed",
                '404' : "File not found",
                '500' : "Internal Server Error.",
                '503' : "Service Unavailable"
            };

            if (x.status) {
                message = statusErrorMap[x.status];

                if(!message)
                    message="Unknow Error, status code : " + x.status;                  
            }
            else if(exception=='parsererror'){
                message="Error.\nParsing JSON Request failed.";
            }
            else if(exception=='timeout'){
                message="Request Timed out.";
            }
            else if(exception=='abort'){
                message="Request was aborted by the server";
            }
            else {
                message="Unknow Error, exception : " + exception;
            }

            console.log(message);
        }
    };

    return AjaxRequest;
}));