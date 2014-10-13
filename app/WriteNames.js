(function (root, factory) {
	var nsParts = 'rose/animations/WriteNames'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(
	    	require('jquery'),
	    	require('lodash'),
	    	require('./lagrange/drawing/EmilieFont.js'),
	    	require('./DecorativeLines'),
	    	require('./lagrange/drawing/DrawPath'),
	    	require('./lagrange/drawing/VectorWord'),
	    	require('./lagrange/drawing/PathGroup'),
	    	require('raphael'),
	    	require('gsap'));
  	} else {
		ns[name] = factory(root.jQuery, root._);
	}
}(this, function ($, _, EmilieFont, DecorativeLines, DrawPath, VectorWord, PathGroup, Raphael, TweenMax) {

	var gsap = window.GreenSockGlobals || window;

	var defaultSettings = {
		color: '#444444',
		stroke: 2,
		lineHeight: 1.2,
		speed: 250 //px per second
	};

	var getAppend = function(paths, append){
		var curve = append.symbol;
		
		//trouve les points de départ et d'arrivée de la curve
		var curveStr = curve.getSVGString();
		var startPos = Raphael.getPointAtLength(curveStr, 0);
		var endPos = Raphael.getPointAtLength(curveStr, curve.getLength());

		var wordPaths = paths.getPaths();
		//trouve le path qui finit le plus à droite dans les lettres
		var lastPath = wordPaths.reduce(function(last, cur){
			if(!last) return cur;
			//si le path se finit plus à droite ET qu'il a un nom (les détails genre barre du t et point de i n'ont pas de nom)
			if(cur.name && last.getBounding().x2 < cur.getBounding().x2){
				last = cur;
			}
			return last;
		}, null);

		var wordEndPos = Raphael.getPointAtLength(lastPath.getSVGString(), lastPath.getLength());

		//position absolue du point de départ du path
		var absStartPos = {
			x: wordEndPos.x - startPos.x,
			y: wordEndPos.y - startPos.y
		};

		/*showPoint({x:wordEndPos.xx, y:wordEndPos.y}, '#22ff00');
		showPoint(absStartPos, '#ff0000');/**/

		//à combien de distance le boute est du début
		var relEndPos = {
			x: endPos.x - startPos.x,
			y: endPos.y - startPos.y
		};

		//à quel endroit on doit faire arriver le endpos, relatif au début du path
		var targetRelEndPos = {
			x: - wordEndPos.x,
			y: append.size * EmilieFont.getUpperLineHeight()
		};

		var ratio = {
			x : targetRelEndPos.x / relEndPos.x,
			y : targetRelEndPos.y / relEndPos.y,
		};
		/*console.log('start at',absStartPos);
		console.log(targetRelEndPos);
		console.log(ratio, currentEndPos);**/

		var m = Raphael.matrix();
		m.scale(ratio.x, ratio.y, absStartPos.x+startPos.x, absStartPos.y);
		m.translate(absStartPos.x, absStartPos.y);
		curve = curve.applyMatrix(m);

		lastPath.append(curve);

		return paths;

	};
	
	var getWords = function(words, lineHeight) {
		var top = 0;
		return words.map(function(word, lineNum){

			var paths = VectorWord.getPaths(EmilieFont, word.text);
			paths = paths.scale(word.size);

			//center text
			var width = paths.getWidth();
			var left = - width / 2;

			paths.setOffset(left, top);
			
			top += EmilieFont.getUpperLineHeight() * lineHeight;

			//ajoute le guidi sur le dernier mot
			if(word.append) {
				paths = getAppend(paths, word.append(DecorativeLines));
			}

			word.paths = paths;

			return word;

		});
	};


	//trouve le bounding box de l'ensemble des paths, s'en servira pour s'assurer que ça entre toujours dans le stage
	var getBounding = function(words){
		return words.reduce(function(g, w){
			w.paths.getPaths().forEach(function(p){
				g.addPath(p);
			});
			return g;
		}, PathGroup.factory()).getBounding();
	};

	return {
		getTimeline : function(words, stage, settings) {
			settings = _.extend({}, defaultSettings, settings);
			words = getWords(words, settings.lineHeight);
			var bounding = getBounding(words);

			var layer = stage.getNewLayer();

			/*layer.showPoint({x:bounding.x, y:bounding.y});
			layer.showPoint({x:bounding.x2, y:bounding.y2});/**/
			//console.log(bounding);

			var resizeSet = (function(){
				var padding = 0.1;//%
				var W = 0, H = 0;
				return function(){
					
					//if(stage.width === W && stage.height === H)  return;

					W = stage.width() * (1-padding);
					H = stage.height() * (1-padding);

					var scale = W / bounding.width;
					var targetH = bounding.height * scale;
					if(targetH > H){
						scale = H / bounding.height;
					}
					
					var targetLeft = (stage.width() * padding * 0.5) + ((W - bounding.width) / 2) - bounding.x;
					var targetTop = -(stage.height() * padding * 0.5) + (stage.height() - ( bounding.y + (bounding.height*scale/**/)));
					layer.transform('t'+targetLeft+','+targetTop+'s'+scale+','+scale+',0,0');
				}
			})();

			stage.onResize.progress(resizeSet);

			var tl = words.reduce(function(tl, word, lineNum){
				return DrawPath.group(word.paths.getPaths(), layer, {
					pxPerSecond : settings.speed * word.size,
					color : settings.color,
					strokeWidth : settings.stroke,
					easing : gsap.Sine.easeInOut
				}, tl);
			}, new gsap.TimelineMax({paused:true, onUpdate: resizeSet}));
			
			return tl;

		},

		load : function(){
			console.log(DecorativeLines);
			console.log(EmilieFont);
			return $.when(EmilieFont.load(), DecorativeLines.load());
		}
	};

}));