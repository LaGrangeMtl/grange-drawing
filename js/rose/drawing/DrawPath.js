/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/DrawPath'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof define === 'function' && define.amd) {
		define(
			'rose/drawing/DrawPath',//must be a string, not a var
			[
				'raphael',
				'TweenMax'
			], function (Raphael, TweenMax) {
			return (ns[name] = factory(Raphael, TweenMax));
		});
	} else {
		ns[name] = factory(root.Raphael, (root.GreenSockGlobals || root).TweenMax);
	}
}(this, function (Raphael, TweenMax) {
	"use strict";

	var TimelineMax = (window.GreenSockGlobals || window).TimelineMax;
	

	var defaults = {
		color: '#000000',
		strokeWidth : 0.6,
		pxPerSecond : 100 //speed of drawing
	};


	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;

		//prend la string des points SVG
		this.init = function(path, stageParam, params) {
			pathDef = path;
			stage = stageParam;
			settings.color = params.color ||  defaults.color;
			settings.strokeWidth = params.strokeWidth ||  defaults.strokeWidth;
			settings.pxPerSecond = params.pxPerSecond ||  defaults.pxPerSecond;
			return this;
		};

		this.show = function() {
			var path = pathDef.getSVGString();			
			var el = stage.path(path);
			el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});/**/
		};

		this.draw = function(pxPerSecond){
			var pathStr = pathDef.getSVGString();
			var length = pathDef.getLength();
			var time = length / (pxPerSecond || settings.pxPerSecond);

			var anim = {to: 0};

			var el;
			var update = function(){

				var pathPart = Raphael.getSubpath(pathStr, 0, anim.to);
				if(el) el.remove();
				el = stage.path(pathPart);
				el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
			};

			return TweenMax.to(anim, time, {
				to : length,
				onUpdate : update,
				ease : Quad.easeIn
			});
			
		};

		return this;

	};

	DrawPath.factory = function(o) {
		return DrawPath.apply(o || {});
	};

	/**
	Static. Returns a timelinemax of all the paths in the group, drawn one at a time.
	*/
	DrawPath.group = function(paths, stage, settings, onComplete) {
		return paths.reduce(function(tl, path){
			var drawingPath = DrawPath.factory().init(path, stage, settings);
			return tl.append(drawingPath.draw());
		}, new TimelineMax({ onComplete: (onComplete || function(){}) }));
	};

	return DrawPath;
	
}));


