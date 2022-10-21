CREATE TABLE sales (
  `Transaction_date` DATETIME,
  `Product` VARCHAR(255),
  `Price` INTEGER,
  `Payment_Type` VARCHAR(255),
  `Name` VARCHAR(255),
  `City` VARCHAR(255),
  `State` VARCHAR(255),
  `Country` VARCHAR(255),
  `Account_Created` DATETIME,
  `Last_Login` DATETIME,
  `Latitude` DOUBLE PRECISION,
  `Longitude` DOUBLE PRECISION
);


LOAD DATA LOCAL INFILE '/var/lib/mysql-files/sales.csv'
INTO TABLE sales
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS (`Transaction_date`,`Product`,`Price`,`Payment_Type`,`Name`,`City`,`State`,`Country`,`Account_Created`,`Last_Login`,`Latitude`,`Longitude`);
