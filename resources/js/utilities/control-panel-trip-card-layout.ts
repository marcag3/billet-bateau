/** Trip card height in the control panel lane (boat silhouette). */
export const CONTROL_PANEL_TRIP_CARD_HEIGHT_PX = 720;

/** Trip card width from the 5:12 aspect ratio at the fixed height. */
export const CONTROL_PANEL_TRIP_CARD_WIDTH_PX = Math.round(
    CONTROL_PANEL_TRIP_CARD_HEIGHT_PX * (5 / 12),
);
