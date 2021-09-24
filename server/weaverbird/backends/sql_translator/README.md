# SQL VQB Translator

## Conversions & formats

In a effort to harmonize as much as possible the conversion behaviors, for some cases, the Sql translator implement casting otherwise than the CAST AS method. 

Precisely, when casting float to integer, the default behaviour rounds the result, other languages truncate it. 
That's why the use of `TRUNCATE` was implemented when converting float to int.
The same implementation was done when converting strings to int (for date represented as string).
As for the conversion of date to int, we handled it by assuming the dataset's timestamp is in `TIMESTAMPE_NTZ` format.

