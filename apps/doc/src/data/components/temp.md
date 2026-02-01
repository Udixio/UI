Anatomy
-------

link

Copy link

![Diagram of 4 elements of a chip.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztjtuyd-10.png?alt=media&token=999b1920-2d6e-4cd7-b9c8-78ddde74c657)

1.  Container
2.  Label text
3.  Leading icon or image (optional)
4.  Trailing icon (required for input chips, optional for filter chips)

link

Copy link

### Container

All chips are slightly rounded with an 8dp corner.

![Diagram of rounded corner of chip container.](https://lh3.googleusercontent.com/vQmC7jK0blnznQXHhWp0CdSBv5rz2kM_HaE4_6bNjPYJZ7m8esMLk2mjsq3d_YYoNHL1DVWS0mNeggD2YPKFRWq7LmdauD2q4_QeqAhbh7ZFng=s0)

Chips have rounded corners

link

Copy link

#### Shadows & elevation

Chip containers can be elevated if placed on top of an image or dynamic background.

![3 elevated assist chips above image of restaurant photograph.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm99ytacz-13.png?alt=media&token=b7f1c500-c60e-43d5-b95d-3f930b4d211b)

When on complicated backgrounds, chip containers can be elevated

link

Copy link

![3 types of chips in an outlined style.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8smkogw-14_do.png?alt=media&token=2e20d7c0-d7ae-4960-ae3d-3ea7dc9af20c)

checkDo

Use an outline to define the edge of the chip's container on regular backgrounds

![3 types of chips in an elevated style above restaurant photograph.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8sml3zk-15_do.png?alt=media&token=413b4ccf-6370-4b8c-b311-0ebfcccac584)

checkDo

Chips may use elevation when placed on an image

link

Copy link

![4 elevated chips above blank background.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8smnajs-16_don't.png?alt=media&token=3b06b36e-ee77-4f2e-a619-9773f7844161)

closeDon’t

Chips shouldn't be elevated when placed directly on the page

![Elevated chip in pressed state.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm9a01xre-17_don't.png?alt=media&token=525db271-6e30-413f-b3f4-d7c8d3bf0ae2)

closeDon’t

Avoid using elevation to indicate a chip's pressed state. Instead, use the visual ripple effect.

link

Copy link

### Label text

Chip label text should be 20 characters or fewer, and have the same typography style as buttons.

Chip labels should remain brief for the limited space available. Skip conventional grammar rules, such as articles (take "a" walk), to save space.

![Filter chip in maps app labeled “Walking”.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztjz5d8-17-do.png?alt=media&token=20092f2f-045e-4edf-8e14-9e78f9114f33)

checkDo

Keep chip labels short

![Filter chip in maps app labeled “Walking navigation session”.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztjzmjd-18-dont.png?alt=media&token=553c8425-a48e-4625-939b-3b1a4d3365dc)

closeDon’t

Avoid chip labels longer than 20 characters

link

Copy link

### Leading icon or image (optional)

Chips can contain a leading icon, logo, or circular image. Use a system icon to help identify a chip's category.

![2 input chips, 1 with a leading circular avatar and the other with a leading icon.](https://lh3.googleusercontent.com/54paAbiWax0rtT9FkGkAokFuFZqCr77ChCZATiYDeSdKuytmj1yIEIO62QDdSfxj4J7O3l5DX-BNOXTkj8b7RTpJRIxe6Wvioy0UPzXRudFQ=s0)

Chips can contain a logo, icon, or circular image

link

Copy link

The leading icon color for unselected chips can be customized through theming. While the default color role is **primary**, the **on surface variant** color role is a good alternative when the icon style requires less emphasis.

![2 screens of a restaurant page with chips labeled "Add photos" and "Add dishes." The leading icons are purple in 1, grey in the other.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztk48sd-20.png?alt=media&token=5d587b93-544d-4a45-9be9-542d6d0c639a)

**Primary** color (left) and **on surface variant** color (right)

link

Copy link

Leading circular images are sized larger than leading icons to provide more space for detail. Icons are designed to be legible at small sizes.

See the [Specs tab](https://m3.material.io/m3/pages/chips/specs/) for precise measurement values.

![2 input chips, 1 with a 24dp leading avatar and the other with an 18dp leading icon.](https://lh3.googleusercontent.com/iY2D7FmINqLpS43Y2mhnr_dlNru2sEZCNSyKFwJS_NVseYGAGlY-nRl_qYY4hn_zu4NTZV40NTysX2qaS3NPnh_J6StQbI4mlzvSQkQm3RU=s0)

Leading images, such as avatars, are sized larger than leading icons or logos

link

Copy link

### Trailing icon (optional, input and filter chips only)

The trailing icon is present for input and filter chips.

On input chips, it's required and must be used to remove the chip. On filter chips, it's optional, and can be used to open a menu or remove the chip. 

Secondary actions (such as a trailing icon button for **Remove**) must have a 48x48dp interaction target that doesn’t interfere with the chip's primary action (such as **Edit** or **Drag**). To achieve this, apply a minimum width of 88dp to the chip, or 42dp to the label text.

![A chip with 88dp min width has 2 touch targets of 48x48dp.](https://lh3.googleusercontent.com/FF2wTImHI_AYyfSWhT1XCU8XZj6mbCYc84FMCxjtZZ_lLum6wzABXhazLjGsceEqE9PWB44gmD3DO-j7lbjTrqCa507LWu-t7hdlSLxXt-M=s0)

Interaction targets for actions like **Edit** or **Close** have a size of 48x48. This can be achieved by setting the minimum container width to 88dp.

link

Copy link

Assist chips
------------

link

Copy link

Assist chips represent smart or automated actions that can span multiple apps, such as opening a calendar event from the home screen. Assist chips function as though the person asked an assistant to complete the action. They should appear dynamically and contextually in a UI.

An alternative to assist chips are buttons, which should appear persistently and consistently.

![2 assist chips labeled “Add to my itinerary” and “12 mins from hotel” on map screen about Los Cantantes.](https://lh3.googleusercontent.com/uNDidhMjsDIxQhluaJHdkbRj_xJDpjTTfZN_YLW9tgVUwfShHRsuZgBfzSHWqjR4XJaPR-Hd1AqajUFnrPbtW1LW0c6NrrNYgNb5efdO7pbr=s0)

The text in most assist chips begins with a short verb, like **Get** or **Add**

link

Copy link

![2 assist chips labeled “Event location” and “Chat” on phone lock screen.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8smwopa-25.png?alt=media&token=84a161d6-6b18-4acb-828c-8bff17399130)

An assist chip can surface supplemental information like a calendar event, as well as provide contextual actions

![Assist chip transformed into time picker with radio buttons.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8smx4qo-26.png?alt=media&token=7c211ee9-74de-4ba7-a008-9a62fc6fa312)

During an interaction, assist chips can transform into modals, transition into full-screen views of new content, or readjust to display more results inline

link

Copy link

Assist chips can trigger an action or show progress and confirmation.

Write assist chips like buttons: start with a verb. Adjust text dynamically if the state changes, like **Save** to **Saved**.

pause

Tapping an assist chip triggers a contextual action

pause

Assist chips can show progress and confirmation feedback

link

Copy link

Assist chips are displayed after primary content, such as below a card or persistently at the bottom of a screen.

![3 assist chips labeled “Turn on lights”, “Set alarm”, and "Close Blinds" on Welcome Home screen.](https://lh3.googleusercontent.com/uqMzoI8CijB6iWV4gF5J6aL2rQ4W7JhsIrcJN98krkKJzpyDj1q9Oij6s5VAl7NVQ_LKzVyXwPf3B12ssVbtX8qsCHB7JUmPYjP8nXwY2pWNpw=s0)

Assist chips should be shown underneath primary content

link

Copy link

Filter chips
------------

link

Copy link

Filter chips use tags or descriptive words to filter content. They can be a good alternative to segmented buttons or checkboxes when viewing a list or search results.

Tapping on a filter chip activates it and appends a leading checkmark icon to the starting edge of the chip label.

Write filter chips with nouns that describe the category to **include** in the results. Avoid negative phrases like **Exclude images**.

![4 filter chips labeled “Docs” “Slides” “Sheets” and “Images” with “Slides” and “Sheets” selected](https://lh3.googleusercontent.com/_FpN2Q4Pn2ev44ZnzH3j7EUtUJdwZ7AqRLNVQjhY8btJIKk135AcrsJAjufT287fOoUU5QbPvcm586-RL9RJTPDGJSBQAW7WZ1QIQabJ5P1Naw=s0)

Filter chips rely on tags or descriptive words to filter content

link

Copy link

![5 filter chips representing popular electronics categories in a shopping app. The chip “Game consoles” is selected. ](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8sn3s8s-32.png?alt=media&token=9227cae5-778a-44bf-8a7c-42f75b4835a6)

Filter chips in a shopping app

![6 filter chips representing apartment amenities in a real estate app. 2 of the chips are selected.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8sn4ehq-33.png?alt=media&token=02823c77-4aa6-4603-b3dc-22030f8fe1f3)

Filter chips in a real estate app

link

Copy link

Tap a chip to select it. Multiple chips can be selected or unselected.

![6 filter chips representing apartment amenities in a real estate app. 3 selected chips include checkmarks while 3 don’t.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm9a0g8g2-34.png?alt=media&token=8e8879ac-09ef-444c-8340-d45d028571b9)

An icon can be added to indicate when a filter chip is selected

![3 amenities chips are selected, and 2 neighborhoods. ](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm9a0gd06-35.png?alt=media&token=ff38ae5c-50b2-499f-9204-bfa0d3135145)

Filter chip suggestions can dynamically change as a person starts to select filters

link

Copy link

Alternatively, a single chip can be selected. This offers an alternative to segmented buttons, radio buttons, or single select menus.

However, avoid mixing chip set behaviors. All chip sets on a page should be either single-select or multi-select.

pause

Filter chips can be set so that selecting a single chip automatically deselects all other chips in the set

link

Copy link

In medium and expanded window sizes, filter chips may contain a trailing icon to directly remove the chip or open a menu of options.

In compact windows, the trailing icon's target area is too small to be accessible on its own. However, if the whole chip can be selected to accomplish the action, the chip is likely still accessible.

![Filter chip with trailing remove icon.](https://lh3.googleusercontent.com/AuxLEZb_nITl-CQputrqxzcMPXUeBkAvV1sFuT342wVPxav9dFEaTYNz201yWxHk9c6yEh-UInDpcA3h2-7znxXB9F3PCNiJIl5mzaTD3l0DFQ=s0)

The remove icon helps users remove the filter

![Filter chip with trailing menu icon.](https://lh3.googleusercontent.com/fi0lCD-KiEpAYuO3SZr2jI2I3WWk6us7PlDgn7VIJ2Q7BBCY9fy0LFaLaq3HFIm3JUbnOp8ULGZ5_QEXYFT27T6cbUGSVpuC8mDcsbWcjwiqzg=s0)

Filter chips can open a menu for more filtering options

link

Copy link

When combined with a menu, the filter chip opens a list of selectable options.

pause

exclamationCaution

In compact windows, make sure the whole chip opens the menu. Otherwise, the target area is likely too small to be accessible.

link

Copy link

Filter chips can be used with other components, such as search fields and sheets.

![4 filter chips below search field](https://lh3.googleusercontent.com/gVJ_TV4PsMN0Mhs-oAUEG47Gu9cYDp-T3LPvFLnsFv6yImHWTuuocs9l9en82TB_OrYoW31ffefMMp-rM8UQLo9RnXM5KCNjnbaC2cHrJNim=s0)

Filter chips can be shown underneath a search field

link

Copy link

![Filter chips used as tags in a side sheet on a file application.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8sni3vn-41.png?alt=media&token=cb763d98-2de3-4f8e-9abb-3c125699143d)

Use a side sheet to organize many filter chips

link

Copy link

![6 filter chips wrapping to 2 rows](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztl3mne-41.png?alt=media&token=c2820337-f5ab-4aff-8081-11d14f5773cd)

Filter chips can wrap to a new row. If there are more than two rows, consider using horizontal scrolling to access them all.

![4 filter chips with right-most chip partly offscreen, indicating the chips are horizontally scrollable](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztl40h2-42.png?alt=media&token=10ac484e-eb3c-4dee-8271-fc90e5127357)

Filter chips can scroll horizontally to show many options

link

Copy link

![Single filter chip option beneath the header “Category”](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztl535g-43-dont.png?alt=media&token=c3bec0f6-c82a-454e-8f19-7faa3755d2a7)

closeDon’t

Filter chips should not present only a single option

link

Copy link

Input chips
-----------

link

Copy link

Input chips represent discrete pieces of information entered by a person, such as Gmail contacts or filter options within a search field.

They enable user input and verify that input by converting text into chips.

![Contacts transformed into 2 input chips in a draft event invite](https://lh3.googleusercontent.com/UDjFkP1FOVQtew8xhKWpOI1bUKi2OeWXXgjETDRqn-1ZKzXFw0YNX3UYDJgk_b5s0rKIdh4CJEsU9LARx6SyEmwlGQ8CeeNVyhDxNu1EcQze=s0)

Input chips transform text based on a person's input

link

Copy link

Input chips can support editing to change their contents, such as correcting an email address. In edit mode, the chip reverts back to a text string. Editing can be triggered by interacting with the chip, either by selecting it or by a second interaction after selection.

pause

Input chips converted from email addresses are editable

link

Copy link

pause

Using the backspace key with the cursor before a chip selects the entire chip. The chip can then be deleted when the user taps the backspace key again.

link

Copy link

A single field can contain multiple input chips. These chips can be reordered or moved into other fields.

![2 input chips in the “To” field of an email draft](https://lh3.googleusercontent.com/RgxqbsfzegYgXFAqY6gFgnc_m2Y36fjQfW7cr4h2J7Ar-4eMA8m0sHuYBD9omPg3Fkq4HkU7pIYsAccWpS-kWnkS97zPCTRG7B6rcY7hQfE=s0)

Multiple input chips in one field

![1 input chip moved from the “To” field to the “CC” field of an email draft](https://lh3.googleusercontent.com/ei0DgkxK6YByXQJYx-ZgaGig9oudQEyPHJ8RwkOQ5txRR4sS9ZrlCXyd0Q0Z2N7lQohHqVgD7hvMnuz21gYIfDzTZN3FrsZnHyvM0aPTsQNE=s0)

Input chips being moved from one field to another

link

Copy link

Input chips can expand to show more information or options. A container transform transition pattern is used to reveal additional content.

pause

Input chips can expand

link

Copy link

### Placement

Input chips can be integrated with other components.

They can appear:

*   Inline with the cursor in a text field
*   In a stacked list
*   In a list that can be horizontally scrolled

![4 input chips wrapping to 2 rows.](https://lh3.googleusercontent.com/6ESM4iq-ENjgdXPRgFeaoVpZE2mUv1aL6soIeRHZgDxwAUJTQ2HYdWnCUQSYjaWVl5l7kvSbi9Rtn7NICABYNrE_6230Wv7OxhfoXLs6uN5kSg=s0)

Input chips can wrap to a new row if all chips need to be visible

pause

Input chips can scroll horizontally

link

Copy link

### Icons & images

The leading icon of input chips can be an icon, logo, or circular image.

![2 input chips, 1 with leading thumbnail, 1 with leading icon.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm8snzt8q-60.png?alt=media&token=c295bcf6-1528-4244-90ce-1164046350c0)

Input chips can contain an icon, logo, or circular image

link

Copy link

The trailing icon is always aligned to the end side of the container. It’s placed:

*   On the right for left-to-right (LTR) languages, such as English
*   On the left for right-to-left (RTL) languages, such as Farsi

![2 input chips with trailing icons following the label text.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztl8hee-55.png?alt=media&token=4f7aa05f-7c5f-48eb-a506-01bf4b00db3f)

Input chips can be a more flexible way to filter search results, compared to filter chips

![3 input chips with trailing icons following the label text.](https://lh3.googleusercontent.com/OW0kvrMWhnBCzG4I54KY3xyHktBmFAy75DO82QINdcwZjOKXf4O1cd8TH6sxo2ptCx7Y7wkGkxDnPLfuaI-CLAcLAx-BbkdleTuyJDLH5fBw=s0)

Input chips make it easier to add and remove contacts

link

Copy link

pause

Overflowed chips in a text field should follow the same behavior as regular text. An unfocused text field with overflowed content should display the beginning of the input. Tapping the field snaps the user to the end of the input with the cursor and keyboard active.

link

Copy link

Suggestion chips
----------------

link

Copy link

Suggestion chips help narrow a user’s intent by presenting dynamically generated suggestions, such as possible responses or search filters.

Write suggestion chips as nouns or short phrases, depending on context. Avoid exceeding 20 characters when possible.

![3 suggestion chips offering ID options in a photo-recognition app.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Fm99yzvnz-65.png?alt=media&token=2a4c37d4-4d71-4045-836a-2c8028cdb79a)

The text labels within suggestion chips are most often nouns or short phrases

link

Copy link

![3 suggestion chips with automated reply options in a chat app.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztlb0cw-60.png?alt=media&token=6853add2-195f-47e8-b902-eb3085d43868)

Suggestion chips can offer quick-reply options in a chat or email app

![2 suggestion chips with search options “What song is this?” and “What are the lyrics?”](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztlbx06-61.png?alt=media&token=b95c0757-168c-455a-9fc1-011ea38e927e)

A suggestion chip can help the user start a search

link

Copy link

### Placement

link

Copy link

When displaying multiple chips together, place them inline as a row of options, not listed vertically. Overflowing chips should break to the next line. 

If the field is only one row high, chip sets can scroll horizontally instead.

Keep an 8dp minimum space between chips. Chips must also have a minimum 48dp target size, regardless of placement or density. If required, the target can extend beyond the visible container of the chip.

Text labels for chips should be concise. Chip labels will truncate when in a wrapped layout, and when they are wider than the full width of the window.

![Diagram of margins between a set of chips.](https://firebasestorage.googleapis.com/v0/b/design-spec/o/projects%2Fgoogle-material-3%2Fimages%2Flztlcsh2-62.png?alt=media&token=812ad7a5-cf6b-44e5-bfb5-11e3a9037109)

1.  Margins between chips 
2.  Margin between each line

[




](https://m3.material.io/components/chips/specs)