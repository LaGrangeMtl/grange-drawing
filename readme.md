

Pour que browserify trouve l'app, on doit faire un symlink du folder app ds node_modules

ln -s ../app node_modules/app
ln -s ../app/lagrange node_modules/lagrange
ln -s ../app/rose node_modules/rose