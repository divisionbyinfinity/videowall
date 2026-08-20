# Video Items That Advance When Playback Ends

## Goal

Allow an item with `contentType: "video"` to advance to the next item in its element when the video finishes, without requiring the video's length to be entered manually in `item_duration`.

## Current Behavior

- Every video is configured to loop continuously.
- Every item advances through a duration-based `setTimeout`.
- Each element maintains and advances its own item sequence independently.
- The slide-level `duration` controls when the entire slide ends, regardless of what individual elements are displaying.

## Recommended JSON Format

Introduce an explicit `item_duration` value for videos:

```json
{
  "contentType": "video",
  "content": "example.webm",
  "item_duration": "video"
}
```

The value `"video"` would mean: play the video once and advance to the next item in the same element when playback ends.

Existing `item_duration` behavior would remain unchanged:

- A numeric duration continues to advance the item on a timer.
- A fractional duration continues to represent a portion of the slide duration.
- `"divide"` continues to divide the slide duration equally among the items in that element.

## Proposed Playback Behavior

For a video whose `item_duration` is `"video"`:

1. Disable looping for that video.
2. Start playback when the item becomes active.
3. Listen for the video's `ended` event.
4. When the event fires, advance to the next item in that element.
5. Do not create the normal item-duration timeout for that item.

The event handler must only be able to advance the currently active item. Listeners and timers from previously displayed items should be removed or invalidated so that an old video cannot unexpectedly advance the element.

## Slide-Level Duration

The recommended behavior is to keep the slide-level `duration` as the hard limit for the entire slide.

This means a video can advance its own element when it finishes, but the entire slide may still end while a video is playing. Keeping that limit avoids ambiguity when multiple elements contain videos of different lengths.

Allowing videos to extend the overall slide would require a different scheduling model and should be considered separately.

## Failure Handling

A video might fail to load, fail to play, stall, or never emit `ended`. Without a fallback, that element could remain stuck on the video.

Recommended handling:

- Advance to the next item if the video emits an `error` event.
- Consider adding a maximum fallback timeout for stalled playback.
- Log playback failures when debugging is enabled.
- Handle a rejected `video.play()` promise, since browsers can block autoplay with audio depending on browser and kiosk configuration.

The exact fallback timeout, if one is used, still needs to be selected.

## Single-Item Elements

If an element contains only one video item, advancing wraps back to that same item under the current cycling model. The recommended behavior is therefore to restart the video while time remains in the overall slide.

An alternative would be to leave the video on its final frame. This should be decided before implementation if restarting is not desired.

## Areas That Would Need Changes

### Playback logic

Update `scripts/videowall.js` to:

- Preserve `"video"` as a special duration mode.
- Set `loop` to `false` for videos using that mode.
- Advance on the active video's `ended` event.
- Avoid scheduling a duration timeout for that video.
- Add cleanup and failure handling.
- Continue respecting the remaining slide-level duration.

### JSON generator

Update `json/scripts/json_create.js` so `processItemDuration()` recognizes and preserves `"video"`. Currently, any value other than `"divide"` is treated as numeric input, so `"video"` would otherwise become invalid duration data.

The item-duration field should also explain or offer the new value to users.

### Documentation and examples

Update `README.md` and the JSON generator instructions to document the new duration mode. Add at least one example slide containing a video followed by another item in the same element.

## Suggested Verification

Test the following cases:

- A video using `"video"` advances to an image when playback ends.
- A video using `"video"` advances to another video.
- Two different elements advance independently when their videos end at different times.
- Numeric and `"divide"` durations behave exactly as before.
- The overall slide ends at its configured duration, including during video playback.
- A missing or invalid video does not leave its element stuck indefinitely.
- A single-video element behaves according to the chosen restart/final-frame policy.
- Old video events cannot advance a newly displayed item.
- Autoplay failure is handled without an unhandled promise rejection.

## Decisions to Confirm Before Coding

1. Use `"video"` as the special `item_duration` value, or choose another name such as `"auto"` or `"media"`.
2. Keep the slide-level duration as a hard limit, as recommended, or allow video playback to extend it.
3. For a single-item video element, restart the video or hold its final frame.
4. Choose whether stalled playback needs a maximum fallback timeout and, if so, its duration.

