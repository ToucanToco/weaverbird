mongoimport --db playground_data --collection default-dataset --drop \
    --type=csv --headerline --file /datasources/default-dataset.csv

mongoimport --db playground_data --collection sales --drop \
    --type=csv --headerline --file /datasources/sales.csv

mongoimport --db playground_data --collection sin-from-2019-to-2022 --drop \
    --type=json --file /datasources/sin-from-2019-to-2022.json

mongoimport --db playground_data --collection november-2021-hours --drop \
    --type=json --file /datasources/november-2021-hours.json

