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
		ns[name] = factory(Raphael);
	}
}(this, function (Raphael) {
	"use strict";

	var defaults = {
		color: '#000000',
		strokeWidth : 2
	};


	var DrawPath = {

		//prend la string des points SVG
		setDef : function(def) {
			this.def = def;
		},

		setColor : function(c){
			this.color = c;
		},
		setStrokeWitdh : function(w){
			this.strokeWidth = w;
		},

		setStage : function(stage) {
			this.stage = stage;
		},

		//ajoute un path au stage en one-shot
		show : function(oldEl) {
			
			//if(oldEl) oldEl.remove();

			var path = '';
			this.def.parsed.forEach(function(segment){

				var type = segment.type;
				var fcn = false;

				//clone
				var anchors = segment.anchors.slice(0);

				path += type + anchors.join(','); 

			});
			
			var w = this.strokeWidth || defaults.strokeWidth;
			var c = this.color || defaults.color;

			var el = this.stage.path(path);
			var startOpacity = oldEl ? 0 : 1;
			el.attr({"stroke-width": w, stroke: c, 'stroke-opacity':startOpacity});/**/

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


		},

		//initialise un path pour tracer
		draw : function(steps) {
			steps = Math.ceil(steps) || 500;

			var path = '';
			var stage = this.stage;
			var w = this.strokeWidth || defaults.strokeWidth;
			var c = this.color || defaults.color;
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
					el.attr({"stroke-width": w, stroke: c});

					previous = [x, y];
				};
			}());
			//console.log(this.def);
			var cubic = this.def.getCubic();
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
					this.show(el);
					deferred.resolve();
				}.bind(this)
			});

			return deferred.promise();

		}

	};

	DrawPath.factory = function() {
		return Object.create(DrawPath);
	};

	return DrawPath;
	
}));


