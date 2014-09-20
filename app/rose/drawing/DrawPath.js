/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/DrawPath'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory(require('lodash'), require('raphael'), require('gsap'));
  	} else {
		ns[name] = factory(root._, root.Raphael, (root.GreenSockGlobals || root));
	}
}(this, function (_, Raphael, TweenMax) {
	"use strict";

	//gsap exports TweenMax
	var gsap = window.GreenSockGlobals || window;

	var defaults = {
		color: '#000000',
		strokeWidth : 0.6,
		pxPerSecond : 100, //speed of drawing
		easing : gsap.Quad.easeIn
	};

	//helper
	var showPoint = function(point, stage, color, size){
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000'});
	};

	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;



		//prend la string des points SVG
		this.init = function(path, stageParam, params) {
			pathDef = path;
			stage = stageParam;
			_.extend(settings, defaults, params);
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
			
			var update = (function(){
				var el;
				return function(){
					var pathPart = Raphael.getSubpath(pathStr, 0, anim.to);
					if(el) el.remove();
					el = stage.path(pathPart);
					el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
				};
			})();
			
			var breakPoints = (function(){

				var distanceTreshold = 40;
				var angleTreshold = 12;

				var lastAlpha, alpha, p, diff, pointPos = [];
				var max = length - distanceTreshold;
				for(var i=distanceTreshold; i<=max; i += 2) {
					//var pathPart = Raphael.getSubpath(pathStr, 0, i);
					p = Raphael.getPointAtLength(pathStr, i);
					alpha = p.alpha % 360;
					if(!lastAlpha) {
						lastAlpha = alpha;
						continue;
					}
					var dif = Math.abs(alpha - lastAlpha);
					//console.log(alpha, dif);
					if(dif > angleTreshold) {
						//console.log(alpha, alpha);
						//showPoint(p, stage, '#ff0000');
						pointPos.push(i);
					}
					lastAlpha = alpha;
				}
				//console.log(pointPos);

				return pointPos.reduce(function(points, point){

					var last = points[points.length-1];
					if(!last || point - last[last.length-1] > distanceTreshold){
						last = [point];
						points.push(last);
					} else {
						last.push(point);
					}

					return points;
				}, []).map(function(points){
					return points[Math.floor(points.length/2)];
				});
			})();

			console.log(breakPoints);
			breakPoints.forEach(function(p){
				showPoint(Raphael.getPointAtLength(pathStr, p), stage, '#00ff00', 2);
			});/**/

			var last = 0;
			var tl = breakPoints.reduce(function(tl, dist) {
				var time = (dist-last) / (pxPerSecond || settings.pxPerSecond);
				last = dist;
				return tl.to(anim, time, {to: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (breakPoints[breakPoints.length-1]||0)) / (pxPerSecond || settings.pxPerSecond)), {to: length, ease : settings.easing});

			return tl;

			return gsap.TweenMax.to(anim, time, {
				to : length,
				onUpdate : update,
				ease : settings.easing
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
		}, new gsap.TimelineMax({ onComplete: (onComplete || function(){}) }));
	};

	return DrawPath;
	
}));


