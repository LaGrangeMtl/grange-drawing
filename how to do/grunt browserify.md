

Créer un bundle externe en utilisant les libs dans node_modules à partir de grunt
==============

http://lincolnloop.com/blog/speedy-browserifying-multiple-bundles/

module.exports = {
  options: {
    debug: true,
    transform: ['reactify'],
    extensions: ['.jsx'],
    external: [
      'react',
      'react/lib/ReactCSSTransitionGroup',
      'react/lib/cx',
      'q',
      'underscore',
      'loglevel'
    ]
  },
  app: {
    files: {
      'build/app.js': ['src/app.js']
    }
  },
  vendor: {
    // External modules that don't need to be constantly re-compiled
    src: ['.'],
    dest: 'build/vendor.js',
    options: {
      debug: false,
      alias: [
        'react:',
        'react/lib/ReactCSSTransitionGroup:',
        'react/lib/cx:',
        'q:',
        'underscore:',
        'loglevel:'
      ],
      external: null  // Reset this here because it's not needed
    }
  }
};


Shimmer des plugins non-CommonJs à partir de grunt, avec un transform
=========

https://github.com/jmreidy/grunt-browserify/issues/181

https://github.com/thlorenz/browserify-shim

