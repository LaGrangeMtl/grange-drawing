(function (root, factory) {
	var nsParts = 'lagrange/drawing/Drawing'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('jquery'), require('lodash'), require('raphael'));
  	} else {
		ns[name] = factory(root.jQuery, root._, root.Raphael);
	}
}(this, function ($, _, Raphael) {

	//helper
	var showPoint = function(stage, point, color, size){
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	//layer is an extension of Raphael's set that is linked to a stage, so that you can add directly to it instead of havong to have acces to both the stage and the set.
	var Layer = function(paper) {

		this.add = function() {
			var args = arguments;
			var fcn = Array.prototype.shift.call(args);
			if(!paper[fcn]) throw new Error(fcn + ' does not exist on Raphael');
			
			var el = paper[fcn].apply(paper, args);
			this.push(el);
			return el;
		};

		this.remove = function(el) {
			if(!el) return;
			el.remove();
			this.exclude(el);
		};

		this.showPoint = function(point, color, size){
			var el = showPoint(paper, point, color, size);
			this.push(el);
		};

		this.clearAndRemoveAll = function(){
			var e;
			while(e = this.pop()){
				e.remove();
			}
		};

	};

	var Stage = function(name){

		//le stage est un element contenu dans le container, pour pouvoir le resizer responsive
		var container = $('#'+name);
		var paperName = name+'Paper';
		container.append('<div id="'+paperName+'"></div>');

		var width = container.width();
		var height = container.height();
		var paper = Raphael(paperName, width, height);

		var resizeNotifier = $.Deferred();
		this.onResize = resizeNotifier.promise();

		var onResize = function(){
			width = container.width();
			height = container.height();
			paper.setSize(width, height);
			resizeNotifier.notify({w:width, h:height});
		};

		$(window).on('resize.stage', onResize);


		this.width = function(){
			return width;
		};
		this.height = function(){
			return height;
		};

		this.showPoint = function(point, color, size){
			return showPoint(paper, point, color, size);
		};

		this.getNewLayer = function() {
			var layer = paper.set();
			layer = _.extend(layer, new Layer(paper));
			return layer;
		};

	};

	var getStage = (function(){
		var stages = {};
		var init = function(name){
			return new Stage(name);
		};
		return function(name){
			return stages[name] = stages[name] || init(name);
		}
	})();
	

	return {
		getStage : getStage,
		showPoint : showPoint
	};
}));