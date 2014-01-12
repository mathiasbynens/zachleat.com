/*global module:false,require:false,console:false */
module.exports = function(grunt) {

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
			' <%= pkg.license %> License */\n',
		config: {
			root: 'web/', // from domain root, do not include the first slash, do include a trailing slash
			// See also: yaml.vars.baseurl
			jsSrc: '<%= config.root %>js/',
			cssSrc: '<%= config.root %>css/',
			imgSrc: '<%= config.root %>img/',
			iconsSrc: '<%= config.imgSrc %>icons/',
			distFolder: '<%= config.root %>dist/<%= pkg.version %>/',
			distFeed: '<%- config.root %>_site/feed/atom.xml',
			bowerDir: 'bower_components/'
		},
		yaml: {
			file: '<%= config.root %>_config.yml',
			vars: {
				name: 'Web 3.0, 6 Bladed Razors, 7 Minute Abs',
				description: 'A web development blog written by @zachleat.',
				safe: false,
				auto: true,
				baseurl: '/web',
				markdown: 'rdiscount',
				// https://github.com/mojombo/jekyll/wiki/Permalinks
				permalink: '/<%= config.root %>:title/',
				pygments: true,
				relative_permalinks: false,
				distFolder: '/<%= config.distFolder %>'
			}
		},
		// Task configuration.
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			js: {
				src: ['<%= config.jsSrc %>initial.js'],
				dest: '<%= config.distFolder %>initial.js'
			}
			// CSS concat handled by SASS
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			js: {
				src: '<%= concat.js.dest %>',
				dest: '<%= config.distFolder %>initial.min.js'
			}
		},
		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				unused: true,
				boss: true,
				eqnull: true,
				browser: true,
				globals: {}
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			js: {
				src: ['js/**/*.js']
			}
		},
		sass: {
			dist: {
				options: {
					style: 'expanded'
				},
				files: {
					'<%= config.distFolder %>global.css': ['<%= config.cssSrc %>buttsweater.scss', '<%= config.cssSrc %>socialmenu.scss', '<%= config.cssSrc %>thirdparty.scss', '<%= config.bowerDir %>iliveinomaha/iliveinomaha.css', '<%= config.cssSrc %>pygments.css']
				}
			}
		},
		cssmin: {
			dist: {
				options: {
					banner: '<%= banner %>'
				},
				files: {
					'<%= config.distFolder %>global.min.css': ['<%= config.distFolder %>global.css'],
					'<%= config.distFolder %>icons.min.css': ['<%= config.distFolder %>icons.css']
				}
			}
		},
		grunticon: {
			icons: {
				options: {
					src: '<%= config.iconsSrc %>',
					dest: "<%= config.distFolder %>icons/",
					customselectors: {
						"twitter-active": ".icon-twitter:hover,.icon-twitter:focus,.action a i.icon-twitter",
						"github-active": ".icon-github:hover,.icon-github:focus,.action a i.icon-github",
						"feed-active": ".icon-feed:hover,.icon-feed:focus,.action a i.icon-feed"
					}
				}
			}
		},
		shell: {
			jekyll: {
				command: 'jekyll build --config _config.yml',
				options: {
					stdout: true,
					execOptions: {
						cwd: '<%= config.root %>'
					}
				}
			},
			// generate the pygments css file
			pygments: {
				command: 'pygmentize -S default -f html > pygments.css',
				options: {
					stdout: true,
					execOptions: {
						cwd: '<%= config.cssSrc %>'
					}
				}
			},
			upload: {
				command: 'echo "Note: Requires an \'zachleat\' host in .ssh/config"; rsync -avz ssh ./_site/ zachleat:/home/public/<%= config.root %>',
				options: {
					stdout: true,
					execOptions: {
						cwd: '<%= config.root %>'
					}
				}
			}
		},
		watch: {
			assets: {
				files: ['<%= config.cssSrc %>**/*', '<%= config.jsSrc %>**/*'],
				tasks: ['assets', 'content']
			},
			grunticon: {
				files: ['<%= config.iconsSrc %>**/*'],
				tasks: ['grunticon', 'content']
			},
			content: {
				files: ['<%= config.root %>_posts/**/*', '<%= config.root %>_layouts/**/*', '<%= config.root %>speaking/**/*', '<%= config.root %>projects/**/*', '<%= config.root %>about/**/*', '<%= config.root %>license/**/*', '<%= config.root %>feed/**/*', '<%= config.root %>index.html', '<%= config.root %>_plugins/**/*', '<%= config.root %>_includes/**/*' ],
				tasks: ['content']
			},
			config: {
				files: ['Gruntfile.js'],
				tasks: ['config']
			}
		}
	});

	grunt.registerTask( 'yaml', function() {
		var output = grunt.config( 'yaml.file' ),
			vars = grunt.config( 'yaml.vars' ),
			fs = require('fs'),
			str = [ '# Autogenerated by `grunt config`' ];

		for( var j in vars ) {
			str.push( j + ': ' + vars[ j ] );
		}

		var err = fs.writeFileSync( output, str.join( '\n' ) );
		if(err) {
			console.log(err);
		} else {
			console.log( output + ' write successful.');
		}
	});

	grunt.registerTask( 'feedburner-size', function() {
		var feed = grunt.config.get( 'config.distFeed' ),
			fs = require('fs');

		var stats = fs.statSync( feed ),
			kbSize = Math.ceil( stats.size / 1024 ),
			isTooLarge = kbSize > 512,
			msg = 'Your atom.xml is ' + ( isTooLarge ? 'too large' : 'ok' ) + ' (' + kbSize + 'KB) for Feedburner (512KB max).';

		if( isTooLarge ) {
			grunt.fail.warn( msg );
		} else {
			grunt.log.writeln( msg );
		}
	});

	// Default task.
	grunt.registerTask('assets', ['sass', 'jshint', 'concat:js', 'uglify', 'cssmin']);
	grunt.registerTask('images', ['grunticon']);
	grunt.registerTask('config', ['yaml']);
	grunt.registerTask('content', ['shell:jekyll', 'feedburner-size']);
	grunt.registerTask('default', ['config', 'assets', 'images', 'content']);

	// Upload to Production
	grunt.registerTask('deploy', ['default', 'shell:upload']);
};
