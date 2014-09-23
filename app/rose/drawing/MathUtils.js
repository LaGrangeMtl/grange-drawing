(function (root, factory) {
	var nsParts = 'rose/drawing/MathUtils'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory();
  	} else {
		ns[name] = factory();
	}
}(this, function () {

	var degToRad = Math.PI / 180;
	var radToDeg = 180 / Math.PI;

	return {

		toRadians : function(degrees) {
		  return degrees * degToRad;
		},
		 
		// Converts from radians to degrees.
		toDegrees : function(radians) {
		  return radians * radToDeg;
		}
	};

}));