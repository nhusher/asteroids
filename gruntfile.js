module.exports = function(grunt) {
  
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks("grunt-base64");
  grunt.loadNpmTasks("grunt-mkdir");
  grunt.loadNpmTasks('grunt-shell');
  
  grunt.initConfig({
    clean: {
      all: [ "out" ],
      built: [ "out/temp" ]
    },
    
    uglify: {
      all: {
        files: {
          "out/temp/asteroids.min.js": [ "out/temp/asteroids-concat.js"]
        }
      }
    },
    
    copy: {
      index: {
        src: "src/assets/index.html",
        dest: "out/index.html"
      },
      debug: {
        src: "src/assets/debug.html",
        dest: "out/debug.html"
      }
      
    },
    
    base64: {
      all: {
        files: {
          "out/temp/laser.b64"  : "src/assets/laser.mp3",
          "out/temp/death.b64"  : "src/assets/death.mp3",
          "out/temp/thrust.b64" : "src/assets/thrust.mp3"
        }
      }
    },
    
    concat: {
      sounds: {
        options: {
          separator: "\",\"",
          banner: "MP3=[\"",
          footer: "\"];"
        },
        src: [ "out/temp/laser.b64", "out/temp/thrust.b64", "out/temp/death.b64" ],
        dest: "out/temp/sounds-concat.js"
      },
      files: {
        src: [ "out/temp/sounds-concat.js", "src/js/asteroids.js" ],
        dest: "out/temp/asteroids-concat.js"
      }
    },
    
    shell: {
      png: {
        command: "src/scripts/topng.php out/temp/asteroids.min.js >> out/ast.png"
      }
    }
  });

  grunt.registerTask('default', [
      'clean:all',
      'copy:index',
      'base64:all',
      'concat:sounds',
      'concat:files',
      'uglify:all',
      'shell:png',
      'clean:built'
  ]);  
  
  grunt.registerTask('debug', [
      'clean:all',
      'copy:index',
      'copy:debug',
      'base64:all',
      'concat:sounds',
      'concat:files',
      'uglify:all',
      'shell:png'
  ]);  
}