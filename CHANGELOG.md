# Changelog

## [Unreleased]

## Fixed
- Fixed closing popover on ActionButton when opening one on column header cell

### Changed

- Simplify lowercase and uppercase UI workflow (no need to open form when a
  column is selected)

## [0.3.0] - 2010-10-08

### Added

- Added variable interpolation + autocast handling
- Added `lowercase`step
- Added `uppercase`step

### Changed

- Simplify `percentage` step by removing the optional parameter `new_column`

- Simplify `unpivot` step UX by enforcing automatic column names for
  `unpivot_column_name` and `value_column_name` (not requiring for a user input
  anymore)

### Fixed

- Fixed `top` step initialization (`rank_on` parameter)
- Fixed `argmin` and `argmax` labelling, initialization and interactions
- Fixed shared references between items in List widget.

## [0.2.0] - 2010-09-26

### Added

- Fill "column" field of the filter step when a column is selected.

### Fixed

- Fixed CSS scoping to avoid cluttering style of host application.

## [0.1.0] - 2019-09-17

### Added

- Initial version, showtime!

[0.3.0]: https://github.com/ToucanToco/vue-query-builder/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ToucanToco/vue-query-builder/releases/tag/v0.2.0
