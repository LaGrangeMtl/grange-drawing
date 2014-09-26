'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;'+
			'*/\n\n',
		watch : {
			js : {
				files: 'app/**/*.js',
				tasks: ['browserify:dev']
			}
		},

		uglify: {
			options: {
				banner:  '<%= banner %>'
			},
			build: {
				src: 'js/main.js',
				dest: 'js/main.min.js'
			},
			common: {
				src: 'js/common.js',
				dest: 'js/common.js'
			}
		},

		browserify : {
			options : {
				external: ['es5-shim', 'gsap', 'jquery', 'raphael', 'lodash'],
				browserifyOptions : {
					debug: false
				}
			},
			dev : {
				files: {
				  'js/main.js': ['app/Example.js'],
				},
				options : {
					browserifyOptions : {
						debug: true
					},
				}
			},
			prod : {
				files: {
				  'js/main.js': ['app/Example.js'],
				},
			},
			common: {
				src: ['.'],
				dest: 'js/common.js',
				options: {
					debug: false,
					alias: [
						'es5-shim:',
						'jquery:',
						'raphael:',
						'gsap:',
						'lodash:',
					],
					external : null,
				},
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task.
	grunt.registerTask('default', ['browserify:dev']);
	grunt.registerTask('jslibs', ['browserify:common', 'uglify:common']);
	grunt.registerTask('build', ['browserify:prod', 'uglify:prod']);

};
