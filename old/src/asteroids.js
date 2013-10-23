/* Copyright 2010 Nicholas Husher */
(function() {
	var canvas = document.getElementById('c'),
		context = canvas.getContext('2d'),
		
		// CONSTANTS
		C_UNDEFINED,
		C_NULL = null,
		C_FALSE = false,
		C_TRUE = true,
		C_DEGREES = Math.PI / 180,
		C_MILLISECONDS = 1000,
		C_BEAT = 25, // desired milliseconds between frames = 40fps
		C_360 = 360,
		C_INVULNERABLE_TIME = 5 * C_MILLISECONDS, // shield last 5 seconds
		C_STROKE_STYLE = "#EEE",
		C_CAPTIONS = [ '*BLAM*', '*POW*', '*CRASH*', '*BOOM*' ],
		
		// KEY-CONSTANTS
		C_KEYDN = 'keydown',
		
		// GAME-RELATED CONSTANTS
		C_ROTATION_SPEED   = 270, // don't let rotation get out of hand!
		C_MAX_ASTEROIDS    = 4,   // asteroids = max asteroids * level
		C_SHIP             = 's',
		C_BULLET           = 'b',
		C_PARTICLE         = 'p',
		C_ASTEROID         = 'a',
		C_TEXT             = 't',
		C_SHIELD           = 'h',
		C_BLAST            = 'r',
		
		// UTILITY FUNCTIONS
		F_LENGTH = function(a) { return a.length; },
		F_NOW = function() { return (new Date()).getTime(); },
		F_KEYCODE = function(e) { return e.keyCode; },
		F_UNDEFINED = function(i) { return i === C_UNDEFINED; },
		F_COSINE = function(i) { return Math.cos(i * C_DEGREES); },
		F_SINE = function(i) { return Math.sin(i * C_DEGREES); },
		F_RANDOM = function(m) { return Math.random() * m; },
		F_LATER = function(fn,t) { return setTimeout(fn,t); },

		// returns the distance between two objects
		F_DISTANCE = function(o1,o2) {
			return Math.sqrt(
				Math.pow(o1.x - o2.x, 2) +
				Math.pow(o1.y - o2.y, 2)) - o1.b * o1.s - o2.b * o2.s;
		},
		
		// returns a mixin object of all the input objects, with later
		// parameters overriding earlier ones.
		F_MIX = function() {
			var out = {}, p, i, a = arguments;
			for(i = 0; i < F_LENGTH(a); i += 1) {
				for(p in a[i]) { out[p] = a[i][p]; }
			}
			return out;
		},
		
		// draws a set of points at a certain location on the canvas
		F_DRAW = function(x,y,r,s,p,c) {
			 // x, y, rotation, scale, points, close path?
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
		},
		
		// draws a circle, since we can't easily do that with just points
		// used when drawing the shield
		F_DRAW_CIRCLE = function(x,y,r) {
			// x, y, radius
			context.strokeStyle = '#666';
			context.beginPath();
			context.arc(x, y, r, 0, C_360 * C_DEGREES, false);
			context.stroke();
			context.strokeStyle = C_STROKE_STYLE;
		},
		
		// decodes an encoded point character into an X or Y coordinate.
		// see tests.js for the encoding function and raw point map.
		F_DECODE_CHAR = function(c) {
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
		},
		
		// decompresses a string of characters into an X Y point map
		// this reduces point map size by between 30 and 40 percent
		F_DECOMPRESS = function(s) {
			var out = [], chains = s.split(':');

			chains.forEach(function(coords) {
				var i, chain = [];
				for(i = 0; i < F_LENGTH(coords); i += 2) {
					chain.push([ F_DECODE_CHAR(coords[i]),
						F_DECODE_CHAR(coords[i+1]) ]);
				}
				out.push(chain);
			});
			return out;
		},
		
		// NON_CONSTANTS
		G_SHIP         = C_NULL,  // shortcut to the player ship
		G_SCOREBOARD   = C_NULL,  // shortcut to the scoreboard
		G_SHIELD_TIME  = C_FALSE, // timestamp when last shield was created
		G_MISSILES     = 5,       // remaining missiles
		G_LIVES        = 2,       // remaining lives
		G_ASTEROIDS    = 0,       // asteroids on the playing field
		G_LAST_BULLET  = F_NOW(), // the last time the player shot
		G_BULLET_LIFE  = 1.5,     // the lifetime of the bullet
		G_ENTITIES     = [],      // a list of the objects on the field
		G_DEFAULTS     = {
			// default values when spawning new objects
			x:0, y:0, r:0, dx:0, dy:0, dr:0, dts: 0, s:1, b: 0
		},
		G_PAUSED       = C_FALSE, // is the game paused?
		G_LEVEL        = 1,       // what level is it?
		G_LEVEL_START  = F_NOW(), // when did the level start?
		G_SCORE        = 0,       // current score
		G_COLLISIONS   = [],      // a list of collisions per tick
		G_CAPTION_PTR  = 0,       // which caption to display next
		G_MAX_X,                  // maximum horiz extent of the field
		G_MAX_Y,                  // maximum vert extent of the field
		G_CANVAS_W,               // canvas width (G_MAX_X * 2)
		G_CANVAS_H,               // canvas height (G_MAX_Y * 2)
		G_LAST_TICK,              // used to generate time deltas
		G_TIMEOUT,                // timeout for game execution loop
		
		// OBJECTS
		OBJECTS = {
			/*
			t:  type
			p:  points
			b:  bounding circle size
			sp: spawn callback
			ds: despawn callback
			c:  collision callback
			*/
			's': {
				t: C_SHIP,
				p: F_DECOMPRESS('gWYlZonool:eiiijggbdg'),
				th: F_DECOMPRESS('iqeqbxevgxivlx'), // thruster pointmap
				b: 10,
				i: C_TRUE, // invulnerable?
				sp: function() {
					G_SHIP = this;
					G_SHIELD_TIME = F_NOW();
				},
				ds: function() {
					S_PLAY(S_EXPLODE);

					for(var i = 0; i < 50; i += 1) {
						O_SPAWN(C_PARTICLE, {
							parent: this,
							r: (C_360/50) * i
						});
					}
					
					if(F_LENGTH(G_SHIP.p) == 3) {
						G_SHIP.p.pop();						
					}
															
					R_THRUST = function() {};
					R_ROTATE = function() {};
					G_SHIP = C_NULL;

					if(G_LIVES > 0) {
						F_LATER(function() {
							G_LIVES -= 1;
							O_SPAWN(C_SHIP, {});	
						}, 3 * C_MILLISECONDS);						
					} else {
						F_LATER(function() {
							O_SPAWN(C_TEXT, { y: 50, m: "GAME OVER", l: 5 });
							G_LEVEL = 1;
							F_LATER(INIT, 5 * C_MILLISECONDS);
						}, C_MILLISECONDS);
					}
				},
				c: function(a) {
					if(a.t == C_ASTEROID && this.i !== C_TRUE) {
						this.l = -1;
					}
				}
			},
			'b': {
				t: C_BULLET,
				p: F_DECOMPRESS('gegi'),
				b: 2,
				l: G_BULLET_LIFE,
				sp: function(p) {
					var that = this;
					if(p) {
						S_PLAY(S_LASER);
						
						that.x = p.x;
						that.y = p.y;
						that.r = p.r;
						that.dx = F_COSINE(p.r - 90) * 250 + p.dx;
					 	that.dy = F_SINE(p.r - 90) * 250 + p.dy;
					}
				},
				c: function(a) {
					if(a.t == C_ASTEROID) {
						this.l = -1;
					}
				}
			},
			'p': {
				t: C_PARTICLE,
				p: F_DECOMPRESS('gggj'),
				sp: function(p) {
					var that = this;
					that.x = F_RANDOM(p.b * p.s) - p.b/2 + p.x;
					that.y = F_RANDOM(p.b * p.s) - p.b/2 + p.y;
					that.dx = F_COSINE(that.r - 90) * 250;
				 	that.dy = F_SINE(that.r - 90) * 250;
					that.dr = 0;
					that.l = F_RANDOM(0.3);
				}
			},
			'a': {
				t: C_ASTEROID,
				p: F_DECOMPRESS('dyltsstpxgvWgOYWSYVgTr'),
				b: 20,
				sp: function(px) {
					var p = px || { dx: 0, dy: 0 },
						c = (px) ? 100 : 200, that = this;
					
					if(px) {
						that.s = F_RANDOM(0.4) * px.s + 0.5;
						that.x = F_RANDOM(px.b * px.s) - px.b/2 * px.s + px.x;
						that.y = F_RANDOM(px.b * px.s) - px.b/2 * px.s + px.y;
					} else {
						that.s *= (F_RANDOM(1) + 1);
						that.ba = C_TRUE;
					}
					
					that.r = F_RANDOM(C_360);
					that.dx = F_RANDOM(c) - c/2 + p.dx;
					that.dy = F_RANDOM(c) - c/2 + p.dy;
					that.dr = F_RANDOM(50) - 25;
					
					G_ASTEROIDS += 1;
				},
				ds: function(a) {
					var i, that = this, bigAsteroid = !!that.ba, s = 0;
					G_ASTEROIDS -= 1;
					
					// add to score. More points for greater distance.
					if(a.t === C_BULLET && G_SHIP) {
						s = ((bigAsteroid) ? 50 : 10) *
							Math.floor(F_DISTANCE(that, G_SHIP)/10);
							
						G_SCORE += s;
					}

					for(i = 0; i < 5; i++) {
						if(bigAsteroid) {
							O_SPAWN(C_ASTEROID, { parent: that });
						}
						O_SPAWN(C_PARTICLE, {
							parent: that, r: F_RANDOM(C_360)
						});
						
						O_SPAWN(C_PARTICLE, {
							parent: that, r: F_RANDOM(C_360)
						});
					}
					
					// sometimes spawn a shield generator
					if(!bigAsteroid && F_RANDOM(10) < 1) {
						O_SPAWN(C_SHIELD, {
							x: that.x,
							y: that.y,
							dx: that.dx / 2,
							dy: that.dy / 2
						});
					}
					
					if(s > 0) { O_SCOREUP(that.x,that.y,s); }
					
					S_CAPTION(that.x,that.y);
					S_PLAY(S_EXPLODE);					
				},
				c: function(a) {
					if(a.t == C_BULLET || a.t == C_SHIP) {
						this.l = -1;
					}
				}
			},
			'h': {
				t: C_SHIELD,
				p: F_DECOMPRESS('Ygcbkbogklcl'),
				b: 8,
				dr: 300,
				l: 10,
				ds: function(a) {					
					if(a && a.t == C_SHIP) {
						G_SHIP.i = C_TRUE;
						G_SHIELD_TIME = F_NOW();
						G_SCORE += 250;
						O_SCOREUP(this.x,this.y,250);
					}
				},
				c: function(a) {
					if(a.t == C_SHIP) { this.l = -1; }
				}
			},
			'r': {
				t: C_BLAST,
				p: F_DECOMPRESS('gegi'),
				l: 0.66,
				sp: function(p) {
					var that = this;
					if(!F_UNDEFINED(p)) {
						S_PLAY(S_LASER);
						
						that.x = p.x;
						that.y = p.y;
						that.r = p.r;
						that.dx = F_COSINE(p.r - 90) * 250 + p.dx;
					 	that.dy = F_SINE(p.r - 90) * 250 + p.dy;
					}
				},
				ds: function() {
					var that = this, i, r;
					for(i = 0; i < 40; i += 1) {
						r = (C_360/40) * i;
						O_SPAWN(C_BULLET, {
							x: that.x,
							y: that.y,
							r: r,
							l: 0.2,
							dx: F_COSINE(r - 90) * 800,
							dy: F_SINE(r - 90) * 800
						});
					}
					
					S_CAPTION(that.x,that.y);
					S_PLAY(S_EXPLODE);
				}
			},
			't': {
				t: C_TEXT
			}
		},
		
		// the character map contains all the compressed characters
		// the game uses, stored as pointmaps.
		CHARACTER_MAP = { 
			'0': F_DECOMPRESS('kgqguku0q4k4g0gkkg:rljz'), 
			'1': F_DECOMPRESS('jlngn4:g4u4'), 
			'2': F_DECOMPRESS('gllgpgultqktgyg4u4'), 
			'3': F_DECOMPRESS('gjjgrgujuosqusu1r4j4g1:sqlq'), 
			'4': F_DECOMPRESS('q4qggtut'), 
			'5': F_DECOMPRESS('tggggqqqttt1r4g4'), 
			'6': F_DECOMPRESS('qgjlgqg1j4r4u1usrpkpgu'), 
			'7': F_DECOMPRESS('hlhgugl4'), 
			'8': F_DECOMPRESS('ijlgpgsjsnpqlqinij:gukrqruuu0q4k4g0gu'), 
			'9': F_DECOMPRESS('h4p3uxuqukqgkggkgrkvpvuq'), 
			' ': F_DECOMPRESS('gg'),
			'*': F_DECOMPRESS('njn1:gsus:ilsz:sliz'),
			'@': F_DECOMPRESS('sguk'), // @ = left single quote
			'#': F_DECOMPRESS('iggk'), // # = right single quote 
			'A': F_DECOMPRESS('g5gokgqguou5:gsus'), 
			'B': F_DECOMPRESS('ggg4r4u1uvrsupujrggg:gsrs'), 
			'C': F_DECOMPRESS('ukqgkggkg0k4q4u0'), 
			'D': F_DECOMPRESS('ggqgulu0q4g4gg'), 
			'E': F_DECOMPRESS('ugggg4u4:gsqs'), 
			'F': F_DECOMPRESS('ugggg5:osgs'),
			'G': F_DECOMPRESS('ukqgkggkg0k4q4u0usps'),
			'H': F_DECOMPRESS('gfg5:ufu5:gsus'), 
			'I': F_DECOMPRESS('igsg:i4s4:ngn4'),
			'L': F_DECOMPRESS('gfg4t4'), 
			'M': F_DECOMPRESS('g5ggnnugu5'), 
			'N': F_DECOMPRESS('g5ggu4uf'), 
			'O': F_DECOMPRESS('jgrguju1r4j4g1gjjg'), 
			'P': F_DECOMPRESS('g5ggsguiuqssgs'), 
			'R': F_DECOMPRESS('g5ggsguiuqssgs:msu5'), 
			'S': F_DECOMPRESS('ukqgkggkgpjsrsuvu1q4j4g0'), 
			'T': F_DECOMPRESS('ggug:ngn5'), 
			'U': F_DECOMPRESS('gfg1j4r4u1uf'), 
			'V': F_DECOMPRESS('gfn3uf'),
			'W': F_DECOMPRESS('gfgqj4nqr4uquf')
		},
		
		G_SHIP_ICON = OBJECTS[C_SHIP].p.slice(0),
		
		// OBJECT UTILITY FUNCTIONS
		O_SPAWN = function(type, config) {
			var ent = F_MIX(G_DEFAULTS, OBJECTS[type], config);
			G_ENTITIES.push(ent);
			if(ent.sp) {
				ent.sp.call(ent, (ent.parent) ? ent.parent : C_FALSE);				
			}
			return ent;
		},
		
		O_DESPAWN = function(i) {
			var ent = G_ENTITIES[i], cause = G_COLLISIONS[i];
			G_ENTITIES[i] = C_NULL;
			if(ent.ds) {
				ent.ds.call(ent, cause);
			}
		},
		
		// calculate any collisions and call the objects' collision callbacks,
		// if they have them.
		O_COLLISIONS = function() {
			var collisions = [], i, j, k, l;
			
			for(i = 0; i < F_LENGTH(G_ENTITIES); i += 1) {
				for(j = i+1; j < F_LENGTH(G_ENTITIES); j += 1) {
					if(F_DISTANCE(G_ENTITIES[i], G_ENTITIES[j]) <= 0) {	
						l = G_ENTITIES[i];
						k = G_ENTITIES[j];

						collisions[j] = l;
						collisions[i] = k;
						
						if(l.c) { l.c(k); }
						if(k.c) { k.c(l); }
					}
				}
			}
			
			return collisions;
		},
		O_DRAW = function(ent) {
			if(ent.i) { // if invlunerable, draw a shield
				F_DRAW_CIRCLE(ent.x,ent.y,ent.b * 1.5);
			}
			
			// if text, draw it centered on its x/y coords.
			if(ent.t == C_TEXT) {
				var i, st = ent.m.toUpperCase(), p,
					ox = F_LENGTH(st) * -20/2 * ent.s + ent.x,
					oy = ent.y - 25/2 * ent.s ;
				
				for(i = 0; i < F_LENGTH(st); i += 1) {
					p = CHARACTER_MAP[st.charAt(i)];

					if(!F_UNDEFINED(p)) {
						F_DRAW(ox + (i * 20 * ent.s), oy, 0, ent.s, p);
					}
				}
			} else {
				F_DRAW(ent.x,ent.y,ent.r,ent.s,ent.p,C_TRUE);				
			}
		},
		
		// draw a moving bit of text showing how many points an entity has
		// just given the player.
		O_SCOREUP = function(x,y,s) {
			O_SPAWN(C_TEXT, {
				m: "" + s,
				s: 0.5,
				l: 1,
				dy: -15,
				x: x,
				y: y - 15
			});
		},
		
		// clean up entities that have a negative lifespan.
		O_CLEANUP = function() {
			for(var i = 0; i < F_LENGTH(G_ENTITIES); i += 1) {
				if(G_ENTITIES[i] == C_NULL) {
					G_ENTITIES.splice(i,1);
					i -= 1;
				}
			}
		},
		
		// SOUND CONTSTANTS
		S_PLAY_SOUNDS,                 // does the browser support sound?
		S_SHOULD_PLAY_SOUNDS = C_TRUE, // is the sound turned on?
		S_LASER = 0,
		S_THRUST = 1,
		S_EXPLODE = 2,
		
		S_SOUNDS = [],
		S_THRUST_LAST_PLAY = F_NOW(),
		
		// SOUND UTILITY FUNCTIONS
		S_NEW_AUDIO = function() {
			return !F_UNDEFINED(window.Audio) ? new Audio() : false;			
		},
		
		S_INIT_SOUNDS = function() {
			var a = S_NEW_AUDIO();

			// Sound is available when the following things are true:
			// 1. The BOM has an "Audio" object available to it*
			// 2. There isn't a #nosound hash at the end of the url
			// 3. It can play an mpeg stream (mp3)
			//
			// * note that while IE9 Platform Preview has the audio
			//   _tag_ available to it, it does not have an audio object
			//   I made this choice specifically because the audio api in
			//   IE9 PP is extremely beta and tended to crash the browser
			//   at random intervals, while not ever playing sounds, even
			//   if it supports MP3 audio.
			//
			//   There apppear to be two possible reasons for this. The first
			//   is a known issue when dynamically setting the source of an
			//   html5 media tag[1][2], and the other is that it's possible
			//   data URIs are not supported on the src attribute of media
			//   tags yet[2].
			//
			// [1]: https://connect.microsoft.com/IE/feedback/details/582691
			// [2]: http://bit.ly/cTyuQg
			// [3]: http://bit.ly/Wu4rf
			
			S_PLAY_SOUNDS = (a &&
				window.location.hash !== '#nosound' &&
				a.canPlayType &&
				!!(a.canPlayType('audio/mpeg;').replace(/no/, '')));

			if(S_PLAY_SOUNDS) {
				a = S_NEW_AUDIO();
				a.src = MP3[S_LASER];
				a.load();
				S_SOUNDS.push(a);

				a = S_NEW_AUDIO();
				a.src = MP3[S_THRUST];
				a.load();
				S_SOUNDS.push(a);
				
				a = S_NEW_AUDIO();
				a.src = MP3[S_EXPLODE];
				a.load();
				S_SOUNDS.push(a);				
			}
		},
		S_PLAY = function(sound) {
			if(S_PLAY_SOUNDS && S_SHOULD_PLAY_SOUNDS) {
				if(sound == S_THRUST) {
					// don't stack thrusts. it slows the browser down
					// and sounds awful.
					if(F_NOW() - S_THRUST_LAST_PLAY > 60) {
						S_SOUNDS[sound].play();
						S_THRUST_LAST_PLAY = F_NOW();						
					}	
				} else {
					S_SOUNDS[sound].play();
				}				
			}
		},
		S_STOP = function(sound) {
//          This seems to just slow most browsers down.
//			if(S_PLAY_SOUNDS) {
//				S_SOUNDS[sound].pause();
//				S_SOUNDS[sound].currentTime = 0;
//			}
		},
		
		// If a browser can't play MP3s (see INIT_SOUNDS above), display
		// a comic book style caption instead.
		S_CAPTION = function(x,y) {
			if(!S_PLAY_SOUNDS) {
				O_SPAWN(C_TEXT, {
					m: C_CAPTIONS[G_CAPTION_PTR],
					s: 0.5,
					dts: 0.5,
					l: 0.4,
					x: x,
					y: y
				});
				G_CAPTION_PTR += 1;
				G_CAPTION_PTR = G_CAPTION_PTR % F_LENGTH(C_CAPTIONS);
			}
		},
		
		// RENDER LOOP
		R_THRUST = function() {}, // thrust the ship? altered by R_INPUT
		R_ROTATE = function() {}, // rotate the ship? altered by R_INPUT
		
		R_TICK = function() {
			if(!G_PAUSED) {				
				var i, o, dt = F_NOW() - G_LAST_TICK, m;
				G_COLLISIONS = O_COLLISIONS();
				
				G_SCOREBOARD.m = "SCORE " + G_SCORE;
				G_SCOREBOARD.x = G_MAX_X - F_LENGTH(G_SCOREBOARD.m) * 12/2;

				context.clearRect(-G_MAX_X,-G_MAX_Y,G_CANVAS_W,G_CANVAS_H);

				if(G_SHIP) {
					R_ROTATE();
					R_THRUST();				
				}
			
				for(i = 0; i < F_LENGTH(G_ENTITIES); i += 1) {
					o = G_ENTITIES[i];

					if(!F_UNDEFINED(o.l)) {
						o.l -= (dt / C_MILLISECONDS);
						if(o.l < 0) {
							O_DESPAWN(i);
						}
					}

					if(G_ENTITIES[i] !== C_NULL) {
						m = (dt/C_MILLISECONDS);
						o.r += m * o.dr;
						o.x += m * o.dx;
						o.y += m * o.dy;
						o.s += m * o.dts;

						if(o.x > G_MAX_X) { o.x = -G_MAX_X; }
						if(o.x < -G_MAX_X) { o.x = G_MAX_X; }
						if(o.y > G_MAX_Y) { o.y = -G_MAX_Y; }
						if(o.y < -G_MAX_Y) { o.y = G_MAX_Y; }

						O_DRAW(G_ENTITIES[i]);						
					}
				}
				if(G_SHIELD_TIME) {
					o = C_INVULNERABLE_TIME - (F_NOW() - G_SHIELD_TIME);
					
					if(o > 0) {
						i = "SHIELD ";
						i += Math.floor(o/C_MILLISECONDS) + 1;
						O_DRAW({
							t: C_TEXT,
							m: i,
							y: -G_MAX_Y + 15,
							x: F_LENGTH(i) / -2,
							r: 0,
							s: 0.5
						});						
					} else {
						G_SHIELD_TIME = C_FALSE;
						G_SHIP.i = C_FALSE;
					}
				}
				if(G_MISSILES > 0) {
					O_DRAW({
						t: C_TEXT,
						m: G_MISSILES + " MISSILES",
						y: G_MAX_Y - 15,
						x: -G_MAX_X + 60,
						r: 0,
						s: 0.5
					});
				}
				for(i = 1; i <= G_LIVES; i += 1) {
					F_DRAW(-G_MAX_X + 25*i,
						-G_MAX_Y + 25, 0, 1,
						G_SHIP_ICON, true);
				}
			}
			O_CLEANUP();
			
			G_LAST_TICK = F_NOW();
			G_TIMEOUT = F_LATER(R_TICK, C_BEAT);
			if(G_ASTEROIDS == 0) {
				G_ASTEROIDS = -1;
				G_LEVEL += 1;
				O_SPAWN(C_TEXT, { m: "STAGE COMPLETE" });
				F_LATER(INIT,5*C_MILLISECONDS);
			}
		},
		
		R_INPUT = function(ev) {
			var t = ev.type;
			
			// TODO: ignore inputs if the game is paused unless its to unpause
			if(!G_SHIP) { return; }
			if(F_KEYCODE(ev) == 39) { // right			
				R_ROTATE = t == C_KEYDN ?
					function() { G_SHIP.dr = C_ROTATION_SPEED; } :
					function() { G_SHIP.dr = 0; };
			} else if(F_KEYCODE(ev) == 37) { // left
				R_ROTATE = t == C_KEYDN ? 
					function() { G_SHIP.dr = -C_ROTATION_SPEED; } :
					function() { G_SHIP.dr = 0; };
			} else if(F_KEYCODE(ev) == 38) { // up arrow
				R_THRUST = t == C_KEYDN ?
					function() {
						G_SHIP.dx += F_COSINE(G_SHIP.r - 90) * 10;
						G_SHIP.dy += F_SINE(G_SHIP.r - 90) * 10;
						
						if(F_LENGTH(G_SHIP.p) < 3) {
							G_SHIP.p.push(G_SHIP.th[0]);
						}
						
						S_PLAY(S_THRUST);
					} :	function() {
						S_STOP(S_THRUST);
						if(F_LENGTH(G_SHIP.p) == 3) {
							G_SHIP.p.pop();						
						}
					};
			} else if(F_KEYCODE(ev) == 32 && F_NOW() - G_LAST_BULLET > 300) { 
				// spacebar
				G_LAST_BULLET = G_LAST_TICK;
				O_SPAWN(C_BULLET, { parent: G_SHIP });
			} else if(F_KEYCODE(ev) == 83 && t == C_KEYDN) {
				// s, toggle sounds
				S_SHOULD_PLAY_SOUNDS = !S_SHOULD_PLAY_SOUNDS;
			} else if(F_KEYCODE(ev) == 67 &&
				F_NOW() - G_LAST_BULLET > 300 && G_MISSILES > 0) {

				// fire missile
				G_LAST_BULLET = G_LAST_TICK;
				G_MISSILES -= 1;
				O_SPAWN(C_BLAST, { parent: G_SHIP });
			} else if(F_KEYCODE(ev) == 80 && t == C_KEYDN) {
				// p, pause/unpause
				G_PAUSED = !G_PAUSED;
			}			
		},
		
		// INITIALIZATION FUNCTION,
		INIT = function() {
			var bonus, i;
			if(G_TIMEOUT) { clearTimeout(G_TIMEOUT); }
						
			canvas.height = canvas.offsetHeight;
			canvas.width = canvas.offsetWidth;
			
			G_CANVAS_W = canvas.width;
			G_CANVAS_H = canvas.height;
			
			G_MAX_X = G_CANVAS_W / 2;
			G_MAX_Y = G_CANVAS_H / 2;
			
			context.lineWidth = 1;
			context.strokeStyle = C_STROKE_STYLE;
			
			context.translate(G_MAX_X, G_MAX_Y);
			context.save();
						
			G_ENTITIES   = [];
			G_ASTEROIDS  = 0;
			G_MISSILES   = 5;
			G_SHIP       = C_NULL;
			G_SCOREBOARD = O_SPAWN(C_TEXT, {
				y: -G_MAX_Y + 15, s: 0.5, m: "SCORE " + G_SCORE
			});
			
			if(G_LEVEL == 1) {
				
				// new game / game reset, so reset some key fields
				G_LIVES = 2;
				G_SCORE = 0;
				O_SPAWN(C_TEXT, { y: -100, m: "ASTEROIDS", l: 3 });
			} else {
				
				// give a bonus if they completed the round quickly
				bonus = 35 * G_LEVEL - (F_NOW() - G_LEVEL_START) /
					C_MILLISECONDS;

				bonus = Math.floor(Math.max(bonus,0)) * 10;

				if(bonus > 0) {
					O_SPAWN(C_TEXT, {
						y: -100, m: bonus + " BONUS POINTS", l: 3
					});
					G_SCORE += bonus;
				}
			}
			
			O_SPAWN(C_TEXT, { y: 100, m: "STAGE " + G_LEVEL, l: 3 });
			O_SPAWN(C_SHIP, {});
			
			i = "@C# FOR MISSILES  *  @P# TO PAUSE";
			i += (S_PLAY_SOUNDS) ? "  *  @S# TO TOGGLE SOUND" : "";
			O_SPAWN(C_TEXT, {
				y: G_MAX_Y - 15,
				s: 0.5,
				m: i
			});

			// populate the field with asteroids, more asteroids
			// on each level
			for(i = 0; i < C_MAX_ASTEROIDS * G_LEVEL / 2; i += 1) {
				O_SPAWN(C_ASTEROID, {
					x: -G_MAX_X,
					s: 2,
					y: F_RANDOM(G_CANVAS_H) - G_MAX_Y,
					r: F_RANDOM(C_360)
				});			
				O_SPAWN(C_ASTEROID, {
					x: F_RANDOM(G_CANVAS_W) - G_MAX_X,
					s: 2,
					y: -G_MAX_Y,
					r: F_RANDOM(C_360)
				});
			}

			G_LEVEL_START = F_NOW();			
			G_LAST_TICK = F_NOW();
			
			R_TICK();			
		};

	window.addEventListener(C_KEYDN, R_INPUT, false);
	window.addEventListener('keyup', R_INPUT, false);

	S_INIT_SOUNDS();

	INIT();
}());