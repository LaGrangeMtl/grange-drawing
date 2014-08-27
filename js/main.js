

(function($, createjs, Raphael, Path, DrawPath, Alphabet){
	var W = 1400;
	var H = 1200;
	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	names.length = 10;/**/

	TweenMax.ticker.fps(60)

	/*var getStage = (function(){
		var stage;
		var init = function(){
			return new createjs.Stage(document.getElementById("rootCanvas"));
		};

		return function(){
			return stage = stage || init();
		}
	})();/**/

	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};

		return function(){
			return stage = stage || init();
		}
	})();


	var traceName = function(name, right, top) {
		right = right || 0;
		top = top || 0;

		var continuous = false;
		var lines = [];

		for(var i=0; i<name.length; i++) {
			var letter = name[i];
			if(letter === ' ') {
				right += Alphabet.getLetter('n').bounding[1][0];
				continuous = false;
				continue;
			}
			var letterDef = Alphabet.getLetter(letter);

			var letterJoinedEnd = false;
			letterDef.paths.map(function(path) {
				var def = path.translate([right, top]);
				var joinedStart = def.name && def.name.indexOf('joina') > -1;
				var joinedEnd = /join(a?)b/.test(def.name);
				//console.log(letter, joinedStart, joinedEnd);
				letterJoinedEnd = letterJoinedEnd || joinedEnd;
				if(joinedStart && continuous) {
					//append au continuous
					continuous.append(def, letter);
				} else if(joinedEnd && !continuous) {
					//start un nouveau line
					continuous = def;
					continuous.name = letter;
					lines.push(continuous);
				} else {
					lines.push(def);
				}

				if(!letterJoinedEnd) {
					continuous = false;
				}

			});
			
			right += letterDef.bounding[1][0];
			//console.table([{letter:name[i], letterWidth: letter.bounding[1][0], total:right}]);	
		}

		var drawLine = function(){
			var line = lines.shift();
			if(!line) return;

			var length = line.getLength();
			var steps = length / 40;

			var path = DrawPath.factory();
			path.setDef(line);
			path.setStage(getStage());
			var onEnd = path.draw(steps);
			onEnd.then(function(){
				drawLine();
			});
		};
		drawLine();
	};


	var loading = Alphabet.init();	
	loading.then(function(){
		var incr = H / names.length;
		names.forEach(function(name, k){
			traceName(name, 0, k * incr);
		});

	});


})(jQuery, createjs, Raphael, lagrange.drawing.Path, rose.drawing.DrawPath, rose.drawing.Alphabet);