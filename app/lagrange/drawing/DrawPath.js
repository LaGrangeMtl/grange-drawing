/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/DrawPath'.split('/');
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

	var DrawPath = {

		single : function(path, layer, params){
			
			var settings = _.extend({}, defaults, params);
			var pathStr = path.getSVGString();
			var length = path.getLength();

			var pxPerSecond;
			var time;
			//we can have either a time for the animation, or a number of pixels per second
			if(settings.time){
				time = settings.time;
				pxPerSecond = length / time;
			} else {
				pxPerSecond = settings.pxPerSecond;
				time = length / pxPerSecond;
			}
			//console.log(length, pxPerSecond, time);

			var anim = {start: 0, end: 0};
			
			var update = (function(){
				//console.log('update');
				var el;
				return function(){
					layer.remove(el);
					if(anim.start === anim.end) return;
					var pathPart = path.getSvgSub(anim.start, anim.end, true);
					el = layer.add('path', pathPart);
					el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
				};
			})();

			var easePoints = path.getEasepoints();
			/*console.log(easePoints.length);
			easePoints.forEach(function(pos){
				var p = Raphael.getPointAtLength(pathStr, pos);
				layer.showPoint(p, '#ff0000', 2);
			});/**/
			

			var animate = ['end'];
			//do we need to "undraw" the path after it is drawn?
			if(params.undraw) {
				animate.push('start');
			}

			var getAnimate = function(prop, val){
				var props = {ease : settings.easing};
				props[prop] = val;
				return props;
			};

			return animate.reduce(
				function(tl, prop){
					var last = 0;
					return easePoints.reduce(function(tl, dist) {
						var time = (dist-last) / pxPerSecond;
						last = dist;
						return tl.to(anim, time, getAnimate(prop, dist));
					}, tl).to(anim, ((length - (easePoints.length && easePoints[easePoints.length-1])) / pxPerSecond), getAnimate(prop, length));
				},	
				new gsap.TimelineMax({
					onUpdate : update
				})
			);

			var last = 0;
			var tl = easePoints.reduce(function(tl, dist) {
				var time = (dist-last) / pxPerSecond;
				last = dist;
				return tl.to(anim, time, {end: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (easePoints.length && easePoints[easePoints.length-1])) / pxPerSecond), {end: length, ease : settings.easing});

			return tl;
			
		},

		group : function(paths, layer, settings, tl) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, layer, settings));
			}, tl || new gsap.TimelineMax({paused:true}));
		}
	}

	return DrawPath;
	
}));


