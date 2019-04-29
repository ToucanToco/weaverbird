---
name: UI for new step
about: Checklist of things to think about when creating UI for a new step
title: "[ui-step] UI for step my-step"
labels: ui
assignees: ''

---

# UI to create step my-step

Corresponding typescript interface: `my-step`

## Can your step be created from the column header's popover?

- is it specific to a column type?
- what is the exact list of interactions the user add to perform
  from the moment he clicks until the form appears
- which field(s) should be preset in the form?

## Which category your step belong to?

i.e. which button's popover should you extend the menu of?

## Make sure your step is accessible in the search menu

## Form specificities

- does your form require specific widget (e.g. _autocomplete_, _repeatable inputs_)
- do you require specific interactions with the dataset viewer? (e.g.
  clicking on (multiple) _column headers_, (multiple) _cells_)
- do you need specific interactions with the hosting environment
  (fetch API calls, etc.)
