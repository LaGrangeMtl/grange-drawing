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
				'raphael'
			], function (Raphael) {
			return (ns[name] = factory(Raphael));
		});
	} else {
		ns[name] = factory(root.Raphael);
	}
}(this, function (Raphael) {
	"use strict";

	var defaults = {
		color: '#000000',
		strokeWidth : 0.6
	};


	var DrawPath = function(){

		var color = defaults.color;
		var strokeWidth = defaults.strokeWidth;
		var def;
		var stage;

		//prend la string des points SVG
		this.setDef = function(d) {
			def = d;
		};

		this.setColor = function(c){
			color = c;
		};
		this.setStrokeWitdh = function(w){
			strokeWidth = w;
		};

		this.setStage = function(s) {
			stage = s;
		};

		//ajoute un path au stage en one-shot
		var show = this.show = function(oldEl) {
			
			//if(oldEl) oldEl.remove();
			var path = def.getSVGString();
			
			var el = stage.path(path);
			var startOpacity = oldEl ? 0 : 1;
			el.attr({"stroke-width": strokeWidth, stroke: color, 'stroke-opacity':startOpacity});/**/
			
			if(oldEl) {
				oldEl.animate({
					'stroke-opacity': 0
				}, 500, 'linear', function(){
					oldEl.remove();
				});

				el.animate({
					'stroke-opacity': 1
				}, 300, 'linear');
			}


		};

		//initialise un path pour tracer
		this.draw = function(steps) {
			steps = Math.ceil(steps) || 500;

			var path = '';
			var el;

			var addPoint = (function(){
				var previous;
				return function(x, y) {
					if(previous) {
						path += 'L'+x+','+y;
					} else {

						path += 'M'+x+','+y;
					}
					if(el) el.remove();
					el = stage.path(path)
					el.attr({"stroke-width": strokeWidth, stroke: color});

					previous = [x, y];
				};
			}());
			//console.log(this.def);
			var cubic = def.getCubic();
			var sprite = {x:cubic[0].x,y:cubic[0].y};
			addPoint(sprite.x, sprite.y);
			var deferred = $.Deferred();
			TweenMax.to(sprite, steps, {
				bezier:{ type : "cubic", values : cubic},
				ease:Linear.easeOut,
				useFrames : true,
				onUpdate : function(){
					addPoint(sprite.x, sprite.y);
				},
				onComplete : function(){
					show(el);
					deferred.resolve();
				}
			});

			return deferred.promise();

		};

		return this;

	};

	DrawPath.factory = function(o) {
		return DrawPath.apply(o || {});
	};

	return DrawPath;
	
}));


