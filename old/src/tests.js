(function() {
	var C_SHIP             = 's',
		C_BULLET           = 'b',
		C_PARTICLE         = 'p',
		C_ASTEROID         = 'a',
		C_TEXT             = 't',
		C_DEGREES          = Math.PI / 180,
		context = document.getElementById('c').getContext('2d'),
		canvas = context.canvas;
		
	canvas.width = canvas.offsetWidth;
	canvas.height = canvas.offsetHeight;
	
	context.strokeStyle = "#eee";
	context.strokeWeight = 1;
	context.translate(canvas.width/2, canvas.height/2);
	
	var CHARACTERS = {
		' ': [[[0,0]]],
		"@": [[[12,0],[14,4]]],
		"#": [[[2,0],[0,4]]],
		A: [
			[[0,25],[0,8],[4,0],[10,0],[14,8],[14,25]],
			[[0,12],[14,12]]
		],
		B: [
			[[0,0], [0,24], [11,24], [14,21], [14,15], [11,12], [14,9], [14,3], [11,0], [0,0] ],
			[[0,12],[11,12]]
		],
		C: [[
			[14,4],
			[10,0],
			[4,0],
			[0,4],
			[0,20],
			[4,24],
			[10,24],
			[14,20]
		]],
		D: [
			[[0,0],[10,0],[14,5],[14,20],[10,24],[0,24],[0,0]]
		],
		E: [
			[[14,0], [0,0], [0,24], [14,24]],
			[[0,12], [10,12]]
		],
		F: [
			[[14,0],[0,0],[0,25]],
			[[8,12],[0,12]]
		],
		G: [[
			[14,4],
			[10,0],
			[4,0],
			[0,4],
			[0,20],
			[4,24],
			[10,24],
			[14,20],
			[14,12],
			[9,12]
		]],
		H: [
			[[0,-1],[0,25]],
			[[14,-1],[14,25]],
			[[0,12],[14,12]]
		],
		I: [
			[[2,0],[12,0]],
			[[2,24],[12,24]],
			[[7,0],[7,24]]
		],
		L: [
			[[0,-1],[0,24],[13,24]]
		],
		M: [
			[[0,25], [0,0], [7,7], [14,0], [14,25]]
		],
		N: [
			[[0,25], [0,0], [14,24], [14,-1]]
		],
		O: [
			[[3,0], [11,0], [14,3], [14,21], [11,24], [3,24], [0,21], [0,3], [3,0]]
		],
		P: [
			[[0,25],[0,0],[12,0],[14,2],[14,10],[12,12],[0,12]]
		],
		R: [
			[[0,25],[0,0],[12,0],[14,2],[14,10],[12,12],[0,12]],
			[[6,12],[14,25]]
		],
		S: [
			[[14,4],[10,0],[4,0],[0,4],[0,9],[3,12],[11,12],[14,15],[14,21],[10,24],[3,24],[0,20]]
		],
		T: [
			[[0,0],[14,0]],
			[[7,0],[7,25]]
		],
		U: [
			[[0,-1], [0,21], [3,24], [11,24], [14,21], [14,-1]]
		],
		V: [
			[[0,-1],[7,24],[14,-1]]	
		],
		W: [
			[[0,-1],[0,10],[3,24],[7,10],[11,24],[14,10],[14,-1]]
		],
		'1': [
			[[3,5],[7,0],[7,24]],
			[[0,24],[14,24]]
		],
		'2': [
			[[0,5],[5,0],[9,0],[14,5],[13,10],[4,13],[0,18],[0,24],[14,24]]
		],
		'3': [
			[[0,3],[3,0],[11,0],[14,3],[14,8],[12,10],[14,12],[14,21],[11,24],[3,24],[0,21]],
			[[12,10],[5,10]]
		],
		'4': [
			[[10,24],[10,0],[0,13],[14,13]]
		],
		'5': [[[13,0],[0,0],[0,10],[10,10],[13,13],[13,21],[11,24],[0,24]]],
		'6': [[[10,0],[3,5],[0,10],[0,21],[3,24],[11,24],[14,21],[14,12],[11,9],[4,9],[0,14]]],
		'7': [[[1,5],[1,0],[14,0],[5,24]]],
		'8': [
			[[2,3],[5,0],[9,0],[12,3],[12,7],[9,10],[5,10],[2,7],[2,3]],
			[[0,14],[4,11],[10,11],[14,14],[14,20],[10,24],[4,24],[0,20],[0,14]]
		],
		'9': [
			[[1,24],[9,23],[14,17],[14,10],[14,4],[10,0],[4,0],[0,4],[0,11],[4,15],[9,15],[14,10]]
		],
		'0': [
			[[4,0], [10,0], [14,4], [14,20], [10,24], [4,24], [0,20], [0,4], [4,0]],
			[[11,5], [3,19]]
		],
		'*': [
			[[7,3],[7,21]],
			[[0,12],[14,12]],
			[[2,5],[12,19]],
			[[12,5],[2,19]]
		]
	};
	
	var OBJECTS = {	
		BULLET: [
			[[0, -2], [0, 2]]
		],
		SHIP: [
			[[0,-10], [-8,5], [-7,8], [7,8], [8,5]],
			[[-2,2],[2,2],[3,0],[0,-5],[-3,0]]
		],
		SPARK: [
			[[0, 0], [0, 3]]
		],
		ASTEROID: [
			[[-3,18], [5,13], [12, 12], [13,9], [17,0], [15,-10], [0,-18], [-8,-10], [-14,-8], [-11, 0], [-13, 11]]
		],
		THRUST: [
			[[2,10], [-2,10], [-5,17], [-2,15], [0,17], [2,15], [5,17]]
		],
		SHIELD: [
			[[-8,0],[-4,-5],[4,-5],[8,0],[4,5],[-4,5]]
		]
	};

	var offset = 32;
	
	var toCompressedChar = function(c) {
		var ch = c + offset;

		if(ch < 26) {
			return String.fromCharCode(ch + 65);
		} else if(ch < 52) {
			return String.fromCharCode(ch + (97-26));
		} else if(ch < 62) {
			return String.fromCharCode(ch + (48-52));
		} else {
			return String.fromCharCode(ch + (43-62));
		}
	};
	
	var fromCompressedChar = function(c) {
		var ch = c.charCodeAt(0);
		
		if(ch > 64 && ch < 91) {
			return ch - 65 - offset;
		} else if(ch > 96 && ch < 123) {
			return ch - (96-25) - offset;
		} else if(ch > 47 && ch < 58) {
			return ch - (48-52) - offset;
		} else {
			return ch + 19 - offset;
		}
	};
		
	var compress = function(c) {
		var out = '';
		c.forEach(function(coordChain, i) {
			coordChain.forEach(function(coord) {
				out += toCompressedChar(coord[0]);
				out += toCompressedChar(coord[1]);
			});
			
			if(i !== c.length-1) {
				out += ':';				
			}
		});
		return out;
	};
	
	var decompress = function(c) {
		var out = [], coordChain = c.split(':');
		
		coordChain.forEach(function(coords) {
			var i, chain = [];
			for(i = 0; i < coords.length; i += 2) {
				chain.push([
					fromCompressedChar(coords[i]),
					fromCompressedChar(coords[i+1])
				]); 
			}
			out.push(chain);
		});
		
		return out;
	};
	
	var F_LENGTH = function(a) { return a.length; };
	var Z_DECODE_CHAR = function(c) {
		var ch = c.charCodeAt(0), offset = 32, out;

		if(ch > 64 && ch < 91) {
			out = ch - 65 - offset;
		} else if(ch > 96 && ch < 123) {
			out = ch - 71 - offset;
		} else if(ch > 47 && ch < 58) {
			out = ch + 4 - offset;
		} else {
			out = ch + 19 - offset;
		}
		return out;
	};
	
	var Z_DECOMPRESS = function(s) {
		var out = [], chains = c.split(':');

		chain.forEach(function(coords) {
			var i, chain;
			for(i = 0; i < F_LENGTH(coords); i += 2) {
				chain.push([ Z_DECODE_CHAR(coords[i]), Z_DECODE_CHAR(coords[i+1]) ]);
			}
		});
		return out;
	};

	var F_DRAW = function(x,y,r,s,p,c) { // x, y, rotation, scale, points, close path?
		var i, j;
		
		context.save();
		context.translate(x,y);
		context.rotate(r * C_DEGREES);

		for(j = 0; j < F_LENGTH(p); j += 1) {
			context.beginPath();
			context.moveTo(p[j][0][0] * s, p[j][0][1] * s);
			
			// draw lines from origin
			for(i = 1; i < F_LENGTH(p[j]); i += 1) {
				context.lineTo(p[j][i][0] * s, p[j][i][1] * s);
			}

			if(c) { context.closePath(); }
			context.stroke();			
		}

		context.restore();
	};

	var O_DRAW = function(ent) {
		if(ent.t == C_TEXT) {
			var i, st = ent.m.toUpperCase(), p, l = F_LENGTH(st),
				ox = l * -20/2 + ent.x, oy = ent.y - 25/2;
			
			for(i = 0; i < F_LENGTH(st); i += 1) {
				p = CHARACTERS[st.charAt(i)];

				F_DRAW(ox + (i * 20), oy, 0, 1, p);
			}
		} else {
			F_DRAW(ent.x,ent.y,ent.r,ent.s,ent.p,true);				
		}
	};

	var out = "{ <br />", i = 0, x = canvas.width / -2 + 20;
		
	for(var p in CHARACTERS) {
		c = compress(CHARACTERS[p]);
		
		out += "'" + p + "': F_DECOMPRESS('" + c + "'), <br />";
		
		O_DRAW({ t: C_TEXT, m: p, y: 0, x: (i * 20) + x, r: 0, s: 1 });
		i++;
	}

	out += "}<br />";
	
	out += "{<br />";
	i = 0;
	for(var q in OBJECTS) {
		c = compress(OBJECTS[q]);
		
		out += "'" + q + "': F_DECOMPRESS('" + c + "'), <br />";
		
		O_DRAW({ p: OBJECTS[q], x: (i * 20) + x + 50, y: 45, r: 0, s: 1 });
		i++;
	};
	
	out += "}";

	document.getElementById('p').innerHTML =out;
}());
