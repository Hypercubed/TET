// Generated on 2014-05-30 using generator-angular 0.8.0

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  'use strict';

  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.initConfig({

    build: {
      app: 'app',
      dist: 'public',
      package: grunt.file.readJSON('./package.json'),
      config: grunt.file.readJSON('./config.json')
    },

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['bowerInstall']
      },
      js: {
        files: ['<%= build.app %>/scripts/{,*/}*.js'],
        tasks: [],
        options: {
          livereload: true
        }
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['karma']
      },
      styles: {
        files: ['<%= build.app %>/styles/{,*/}*.css'],
        tasks: ['newer:copy:styles', 'autoprefixer']
      },
      hbs: {
        files: ['<%= build.app %>/{,*/}*.hbs', '<%= build.app %>/views/{,*/}*.hbs'],
        tasks: ['newer:assemble:dev']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: 35729
        },
        files: [
          '<%= build.app %>/{,*/}*.html',
          '.tmp/views/{,*/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= build.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    express: {
      options: {
        port: process.env.PORT || '<%= build.config.port %>' || 9779
      },
      dev: {
        options: {
          script: './lib/server.js',
          node_env: 'development' // eslint-disable-line camelcase
        }
      },
      prod: {
        options: {
          script: './lib/server.js',
          node_env: 'production' // eslint-disable-line camelcase
        }
      }
    },

    open: {
      server: {
        url: 'http://localhost:<%= express.options.port %>'
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= build.dist %>/*',
            '!<%= build.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    // Automatically inject Bower components into the app
    bowerInstall: {
      app: {
        src: ['<%= build.app %>/index.hbs'],
        ignorePath: '<%= build.app %>/'
      }
    },

    // Renames files for browser caching purposes
    rev: {
      dist: {
        files: {
          src: [
            '<%= build.dist %>/scripts/{,*/}*.js',
            '<%= build.dist %>/styles/{,*/}*.css',
            '<%= build.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= build.dist %>/styles/fonts/*'
          ]
        }
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= build.app %>/index.hbs',
      options: {
        dest: '<%= build.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      html: ['<%= build.dist %>/{,*/}*.html'],
      css: ['<%= build.dist %>/styles/{,*/}*.css'],
      options: {
        assetsDirs: ['<%= build.dist %>']
      }
    },

    // The following *-min tasks produce minified files in the dist folder
    cssmin: {
      options: {
        // root: '<%= build.app %>'
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= build.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= build.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= build.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= build.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= build.dist %>',
          src: ['*.html', 'views/{,*/}*.html'],
          dest: '<%= build.dist %>'
        }]
      }
    },

    // ngmin tries to make the code safe for minification automatically by
    // using the Angular long form for dependency injection. It doesn't work on
    // things like resolve or inject so those have to be done manually.
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: '*.js',
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= build.dist %>/*.html']
      }
    },

    // Assemble is used to pre-process some html files
    assemble: {
      dev: {
        options: {
          package: '<%= build.package %>',
          config: '<%= build.config %>',
          env: 'Production'
        },
        expand: true,
        cwd: '<%= build.app %>',
        src: ['*.hbs', 'views/{,*/}*.hbs'],
        dest: '.tmp'
      },
      dist: {
        options: {
          package: '<%= build.package %>',
          config: '<%= build.config %>',
          env: 'Production'
        },
        expand: true,
        cwd: '<%= build.app %>',
        src: ['*.hbs', 'views/{,*/}*.hbs'],
        dest: '<%= build.dist %>'
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= build.app %>',
          dest: '<%= build.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'views/{,*/}*.html',
            'images/{,*/}*.{webp}',
            'fonts/*'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= build.dist %>/images',
          src: ['generated/*']
        }]
      },
      bower: {
        files: [{
          expand: true,
          cwd: '<%= build.app %>/bower_components/bootstrap/dist/fonts/',
          dest: '<%= build.dist %>/fonts',
          src: '*'
        }, {
          expand: true,
          cwd: '<%= build.app %>/bower_components/select2/',
          dest: '<%= build.dist %>/styles',
          src: '*.{png,gif}'
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= build.app %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'copy:styles'
      ],
      test: [
        'copy:styles'
      ],
      dist: [
        'copy:styles',
        // 'imagemin',
        'svgmin'
      ]
    },

    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= build.dist %>/styles/main.css': [
    //         '.tmp/styles/{,*/}*.css',
    //         '<%= build.app %>/styles/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
    // uglify: {
    //   dist: {
    //     files: {
    //       '<%= build.dist %>/scripts/scripts.js': [
    //         '<%= build.dist %>/scripts/scripts.js'
    //       ]
    //     }
    //   }
    // },
    // concat: {
    //   dist: {}
    // },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },

    simplemocha: {
      options: {
        // globals: ['should'],
        timeout: 3000,
        ignoreLeaks: true,
        // grep: 'small',
        ui: 'bdd',
        reporter: 'spec'
      },
      all: {
        src: ['test/backend/*.js']
      },
      small: {
        options: {grep: 'small'},
        src: ['test/backend/extract.js']
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        commitFiles: ['package.json', 'bower.json'],
        push: false
      }
    }

  });

  grunt.registerTask('setup', [
    'clean:server',
    'bowerInstall',
    'concurrent:server',
    'assemble:dev',
    'autoprefixer'
  ]
  );

  grunt.registerTask('express-keepalive', 'Keep grunt running', function () {
    this.async();
  });

  grunt.registerTask('serve', target => {
    if (target === 'dist') {
      return grunt.task.run(['build:dist', 'express:prod', 'express-keepalive']);
    }

    grunt.task.run([
      'setup',
      // 'connect:livereload',
      'express:dev',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'concurrent:test',
    'autoprefixer',
    // 'connect:test',
    'karma'
  ]);

  grunt.registerTask('test:mocha', [
    'setup',
    'express:dev',
    'simplemocha:all'
  ]);

  grunt.registerTask('test:quick', [
    'simplemocha:small'
  ]);

  grunt.registerTask('build', '', build => {
    if (build) {
      grunt.config.data.build.config = grunt.file.readJSON('config_' + build + '.json');
    } else {
      return grunt.log.writeln('Must specify build.');
    }

    return grunt.task.run([
      'clean:dist',
      'bowerInstall',
      'useminPrepare',
      'concurrent:dist',
      'autoprefixer',
      'concat',
      'ngmin',
      'copy:dist',
      'copy:bower',
      'assemble:dist',
      'cdnify',
      'cssmin',
      'uglify',
      'rev',
      'usemin',
      'htmlmin'
    ]);
  });

  grunt.registerTask('default', [
    // 'newer:jshint',
    'test',
    'build'
  ]);
};
