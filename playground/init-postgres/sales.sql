CREATE TABLE sales (
  Transaction_date TIMESTAMP,
  Product VARCHAR(255),
  Price INTEGER,
  Payment_Type VARCHAR(255),
  Name VARCHAR(255),
  City VARCHAR(255),
  State VARCHAR(255),
  Country VARCHAR(255),
  Account_Created TIMESTAMP,
  Last_Login TIMESTAMP,
  Latitude DOUBLE PRECISION,
  Longitude DOUBLE PRECISION
);

COPY sales(Transaction_date,Product,Price,Payment_Type,Name,City,State,Country,Account_Created,Last_Login,Latitude,Longitude) FROM '/datasources/sales.csv' DELIMITER ',' CSV HEADER;
