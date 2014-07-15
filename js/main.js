

(function($, createjs, Path, DrawPath, Alphabet){



	var getStage = (function(){
		var stage;
		var init = function(){
			return new createjs.Stage(document.getElementById("rootCanvas"));
		};

		return function(){
			return stage = stage || init();
		}
	})();

	var loading = Alphabet.init();	
	loading.then(function(){
		var name = 'Marie-Francine';
		
		var right = 0;
		var continuous = false;
		var lines = [];

		for(var i=0; i<name.length; i++) {
			var letter = Alphabet.getLetter(name[i]);

			var letterJoinedEnd = false;
			letter.paths.map(function(path) {
				var def = path.translate([right, 0]);
				var joinedStart = def.name && def.name.indexOf('joina') > -1;
				var joinedEnd = /join(a?)b/.test(def.name);
				//console.log(name[i], joinedStart, joinedEnd);
				letterJoinedEnd = letterJoinedEnd || joinedEnd;
				if(joinedStart && continuous) {
					//append au continuous
					continuous.append(def, name[i]);
				} else if(joinedEnd && !continuous) {
					//start un nouveau line
					continuous = def;
					continuous.name = name[i];
					lines.push(continuous);
				} else {
					lines.push(def);
				}

				if(!letterJoinedEnd) {
					continuous = false;
				}

			});
			
			right += letter.bounding[1][0];
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

		//console.log(lines);
	});

/*

var path = DrawPath.factory();
					path.setDef(pathDef);
					path.setStage(getStage());

					$('#ctrl').off('.line').on('click.line', function(){
						path.draw();
					});
					*/

})(jQuery, createjs, lagrange.drawing.Path, rose.drawing.DrawPath, rose.drawing.Alphabet);