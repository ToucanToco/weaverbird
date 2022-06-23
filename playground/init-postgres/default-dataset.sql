CREATE TABLE default_dataset (
  "Label" VARCHAR(255),
  "Value1" INTEGER,
  "Value2" INTEGER,
  "Value3" INTEGER,
  "Value4" INTEGER,
  "Groups" VARCHAR(255)
);

COPY default_dataset("Label","Value1","Value2","Value3","Value4","Groups") FROM '/datasources/default-dataset.csv' DELIMITER ',' CSV HEADER;
