"use strict";

module.exports = function(grunt) {
  var fs = require('fs'),
      wrench = require('wrench'),
      util = require('util');

  /*****************************************************************************
   * CONFIGURATION
   ****************************************************************************/
  grunt.initConfig({
    dcs: {
      files: ['src/*.profile',
              'src/*.install',
              'src/modules/custom/**/*.module',
              'src/modules/custom/**/*.install',
              'src/modules/custom/**/*.php',
              'src/modules/custom/**/*.inc',
              'src/modules/features/**/*.module',
              'src/themes/custom/**/*.php']
    },
    jshint: {
      files: ['grunt.js', 'src/themes/custom/**/*.js'],
      options: {
        bitwise:true,
        curly:false,
        eqeqeq:true,
        forin:true,
        immed:true,
        latedef:false,
        newcap:true,
        noarg:true,
        noempty:true,
        nonew:true,
        regexp:true,
        undef:true,
        strict:true,
        trailing:true,
        node:true,
        laxcomma:true
      }
    },
    compass: {
      dev: {
        basePath: 'src/themes/custom/algebraix',
        config: 'src/themes/custom/algebraix/config.rb',
        environment: 'development',
        forcecompile: true
      },
      prod: {
        basePath: 'src/themes/custom/algebraix',
        config: 'src/themes/custom/algebraix/config.rb',
        environment: 'production',
        forcecompile: true
      }
    },
    regarde: {
      css: {
        files: '**/*.scss',
        tasks: ['compass:dev']
      }
    },
    make: {
      core: {
        script: 'scripts/server_config/setup_and_installation/run-local-remake-core'
      },
      profile: {
        script: 'scripts/server_config/setup_and_installation/run-local-remake-profile'
      }
    },
    install: {
      fresh: {
        script: 'scripts/server_config/setup_and_installation/run-local-init'
      },
      profile: {
        script: 'scripts/server_config/setup_and_installation/run-local-install'
      }
    },
    ember_templates: {
      compile: {
        options: {
          templateName: function(sourceFile) {
            var source = sourceFile.replace(/src\/themes\/custom\/algebraix\/js\/app\/templates\//, '');
            return source.replace(/-/,'/');
          }
        },
        files: {
          'src/themes/custom/algebraix/js/templates/templates.js': [THEME_PATH + 'js/app/templates/*.hbs']
        }
      }
    },
    requirejs: {
      compile: {
        options: {
          baseUrl: THEME_PATH + 'js/',
          wrap: true,
          almond: true,
          name: 'main',
          out: THEME_PATH + 'js/main-built.js',
          findNestedDependencies: true,
          shim : {
            'ember' : {
              deps: ['handlebars'],
              exports: 'Ember'
            },
            'ember-templates' : {
              deps: ['ember'],
              exports: 'Ember'
            },
            'recurly' : {
              exports: 'Recurly'
            }
          },
          paths : {
              'App': 'app/app',
              'models': 'app/models',
              'views': 'app/views',
              'controllers': 'app/controllers',
              'templates': 'app/templates',
              'fixtures' : 'app/fixtures',
              'routes' : 'app/routes',
              'helpers' : 'app/helpers',
              /*libs*/
              'handlebars': 'libs/handlebars/1.0.rc.3/handlebars',
              'ember': 'libs/ember/1.0.0-rc.3/ember',
              'bootstrap-modal': 'libs/bootstrap/bootstrap-modal',
              'recurly': 'libs/recurly/recurly',
              /*Compiled Templates*/
              'ember-templates' : 'templates/templates',
              /*requirejs-plugins*/
              'domReady': 'libs/requirejs-plugins/domReady'
            }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-compass');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-ember-templates');
  grunt.loadNpmTasks('grunt-requirejs');

  /*****************************************************************************
   * TASK ALIASES
   ****************************************************************************/
  grunt.registerTask('default', ['dcs', 'jshint']);
  grunt.registerTask('watch', ['regarde']);
  grunt.registerTask('css-dev', ['compass:dev']);
  grunt.registerTask('css-prod', ['compass-clean', 'compass:prod']);
  grunt.registerTask('ember', ['jshint','ember_templates', 'requirejs']);


  /*****************************************************************************
   * TASKS
   ****************************************************************************/
  grunt.registerTask('dcs', 'Drupal Coding Standards', function() {
    var task = this.name,
        sources = grunt.file.expand(grunt.config([task, 'files'])),
        done = this.async();

    grunt.util.async.forEachSeries(sources, function(filePath, cb) {
      grunt.verbose.subhead('Linting: ' + filePath);
      grunt.util.spawn({
        cmd: 'drush',
        args: ['dcs', filePath]
      }, function(err, result, code) {
        if (err) {
          console.log(result.stdout);
          cb(err);
        }
        else {
          cb(null);
        }
      });
    }, function(err) {
      if (err) {
        grunt.fatal(err.message, err.code);
      }
      else {
        console.log('Lint free');
      }

      done();
    });
  });


  grunt.registerMultiTask('make', 'Make Core and Profile make files.', function() {
    var target = this.target,
        done = this.async();

    if (target === 'core') {
      console.log('Make Core');
    }

    if (target === 'profile') {
      console.log('Make Profile');
      wrench.rmdirSyncRecursive('src/modules/contrib', true);
      wrench.rmdirSyncRecursive('src/libraries', true);
      wrench.rmdirSyncRecursive('src/themes/contrib', true);
    }

    grunt.util.spawn({cmd: this.data.script}, function(err, result, code) {
        if (result) {
          console.log(result.stdout);
          done(null);
        }

        if (err) {
          console.log(err.message);
          done(err);
        }
      });

  });

  grunt.registerMultiTask('install', 'Install Profile', function() {
    var target = this.target,
        done = this.async();

    if (target === 'fresh') {
      if (fs.existsSync('htdocs/sites/default/settings.php')) {
        grunt.fail.fatal('This project is already initialized! There is no need to run this command. \n\nIf you want to install the profile, run: grunt install:profile');
      }
    }

    grunt.util.spawn({cmd: this.data.script}, function(err, result, code) {
      if (result) {
        console.log(result.stdout);
        done(null);
      }

      if (err) {
        console.log(err.message);
        done(err);
      }
    });
  });
};
