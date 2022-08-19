#!/bin/sh
rm -rf dist/types
npx tsc -p tsconfig.types.json
for file in dist/types/**/*.*
do
  if [ $file = dist/types/main.d.ts ]
  then
    path_to_src=./
  else
    path_to_src=$(echo $file | tr -dc '/' | colrm 1 2 | sed "s#/#../#g")
  fi
  sed -i -r "s#((import|export) .* from ')@/(.*)#\1$path_to_src\3#g" $file
done
