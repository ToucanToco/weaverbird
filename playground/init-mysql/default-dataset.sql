CREATE TABLE default_dataset (
  `Label` VARCHAR(255),
  `Value1` INTEGER,
  `Value2` INTEGER,
  `Value3` INTEGER,
  `Value4` INTEGER,
  `Groups` VARCHAR(255)
);

LOAD DATA LOCAL INFILE '/var/lib/mysql-files/default-dataset.csv'
INTO TABLE default_dataset
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (`Label`,`Value1`,`Value2`,`Value3`,`Value4`,`Groups`);
