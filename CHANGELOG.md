# Changelog


## NEXT_RELEASE - RELEASE_DATE

### Added

- Mongo4.0 translator scaffold

### Fixed

- build stepform validator at submit time to avoid race condition
  between `_updateDataset` and `initialize`

## [0.5.0] - 2019-11-13

### Added

- Added `fromdate` step (converts date into string)
- Added `todate` step (converts string into date)

### Changed

- Use TypeScript 3.7

## [0.4.0] - 2019-10-22

### Changed

- Revamped documentation and auto-publish it on https://weaverbird.toucantoco.com
- Renamed project and repository into `weaverbird`

### Fixed

- Fixed closing popover on ActionButton when opening one on column header cell

### Changed

- Simplify lowercase and uppercase UI workflow (no need to open form when a
  column is selected)

### Added

- Added `concatenate` step
- Added `split` step

## [0.3.0] - 2019-10-08

### Added

- Added variable interpolation + autocast handling
- Added `lowercase` step
- Added `uppercase` step

### Changed

- Simplify `percentage` step by removing the optional parameter `new_column`

- Simplify `unpivot` step UX by enforcing automatic column names for
  `unpivot_column_name` and `value_column_name` (not requiring for a user input
  anymore)

### Fixed

- Fixed `top` step initialization (`rank_on` parameter)
- Fixed `argmin` and `argmax` labelling, initialization and interactions
- Fixed shared references between items in List widget.

## [0.2.0] - 2019-09-26

### Added

- Fill "column" field of the filter step when a column is selected.

### Fixed

- Fixed CSS scoping to avoid cluttering style of host application.

## [0.1.0] - 2019-09-17

### Added

- Initial version, showtime!

[0.4.0]: https://github.com/ToucanToco/weaverbird/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ToucanToco/weaverbird/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ToucanToco/weaverbird/releases/tag/v0.2.0
