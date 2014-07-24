

(function($, createjs, Raphael, Path, DrawPath, Alphabet){



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
			return Raphael("svg", 1200,500);
		};

		return function(){
			return stage = stage || init();
		}
	})();




	var loading = Alphabet.init();	
	loading.then(function(){
		var name = 'p m';
		//console.log(name);
		
		var right = 0;
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
				var def = path.translate([right, 0]);
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
			var steps = length / 125;

			var path = DrawPath.factory();
			path.setDef(line);
			path.setStage(getStage());
			var onEnd = path.draw(steps);
			onEnd.then(function(){
				drawLine();
			});
		};
		drawLine();

	});

})(jQuery, createjs, Raphael, lagrange.drawing.Path, rose.drawing.DrawPath, rose.drawing.Alphabet);