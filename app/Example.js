	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
	var DecorativeLines = require('./DecorativeLines');
	var DrawPath = require('./lagrange/drawing/DrawPath');
	var VectorWord = require('./lagrange/drawing/VectorWord');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	var PathGroup = require('./lagrange/drawing/PathGroup');/**/
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1600;
	var H = 1200;
	var CENTER = W / 2;
	var T = 50;
	var LINE_HEIGHT = 1.2;//em
	var SPEED = 250;//px per sec


	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	
	Shuffle(names);
	//names.length = 1;/**/



	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();
	//helper
	var showPoint = function(point, color, size){
		var el = getStage().circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var loading = $.when(EmilieFont.load(), DecorativeLines.load());

	var words = [
		{
			text : 'Merci',
			size : 0.8
		},
		{
			text : 'Jean-Paul',//names.pop(),
			size : 1,
			append : function(){
				return {
					symbol: DecorativeLines.getSymbol('wordDecorationEnd').getPaths()[0],
					size: 1 //height in em
				};
			}
		}
	];




	var doDraw = function(){
		var top = 0;
		words = words.map(function(word, lineNum){

			var paths = VectorWord.getPaths(EmilieFont, word.text);
			paths = paths.scale(word.size);

			//center text
			var width = paths.getWidth();
			var left = - width / 2;

			paths.setOffset(left, top);
			
			top += EmilieFont.getUpperLineHeight() * LINE_HEIGHT;

			//ajoute le guidi sur le dernier mot
			if(word.append) {
				var append = word.append();
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
				//paths.addPath(curve);
				
			}

			word.paths = paths;

			return word;

		});

		//trouve le bounding box de l'ensemble des paths, s'en servira pour s'assurer que ça entre toujours dans le stage
		var bounding = words.reduce(function(g, w){
			w.paths.getPaths().forEach(function(p){
				g.addPath(p);
			});
			return g;
		}, PathGroup.factory()).getBounding();

		var elementSet = getStage().set();

		var resizeSet = function(){
			var scale = W / bounding.width;
			var targetH = bounding.height * scale;
			if(targetH > H){
				scale = H / bounding.height;
			}
			//console.log(scale);
			
			var targetLeft = ((W - bounding.width) / 2) - bounding.x;
			elementSet.transform('t'+targetLeft+',0s'+scale+','+scale+',0,0');
		};

		var tl = words.reduce(function(tl, word, lineNum){
			return DrawPath.group(word.paths.getPaths(), getStage(), elementSet, {
				pxPerSecond : SPEED * word.size,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			}, tl);
		}, new gsap.TimelineMax({paused:true, onUpdate: resizeSet}));

		tl.play();
	};

		
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});



	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		//EmilieFont
		//DecorativeLines
		PathEasepoints(getStage(), EmilieFont.getAll(), $('#brp'), [W, H]);
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});

