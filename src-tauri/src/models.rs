use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalendarInfo {
    pub id: String,
    pub summary: String,
    pub description: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
    #[serde(rename = "backgroundColor")]
    pub background_color: Option<String>,
    #[serde(rename = "foregroundColor")]
    pub foreground_color: Option<String>,
    pub primary: Option<bool>,
    #[serde(rename = "accessRole")]
    pub access_role: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EventTime {
    pub date: Option<String>,
    #[serde(rename = "dateTime")]
    pub date_time: Option<String>,
    #[serde(rename = "timeZone")]
    pub time_zone: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CalendarEvent {
    pub id: String,
    #[serde(rename = "calendarId")]
    pub calendar_id: String,
    pub summary: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub status: Option<String>,
    #[serde(rename = "colorId")]
    pub color_id: Option<String>,
    #[serde(rename = "eventColor")]
    pub event_color: Option<String>,
    #[serde(rename = "calendarColor")]
    pub calendar_color: Option<String>,
    #[serde(rename = "htmlLink")]
    pub html_link: Option<String>,
    pub start: EventTime,
    pub end: EventTime,
    #[serde(rename = "recurringEventId")]
    pub recurring_event_id: Option<String>,
    #[serde(rename = "originalStartTime")]
    pub original_start_time: Option<EventTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub theme: String,
    #[serde(alias = "always_on_top")]
    pub always_on_top: bool,
    #[serde(alias = "start_with_windows")]
    pub start_with_windows: bool,
    #[serde(alias = "start_hidden")]
    pub start_hidden: bool,
    #[serde(alias = "remember_position")]
    pub remember_position: bool,
    #[serde(alias = "remember_size")]
    pub remember_size: bool,
    pub opacity: f32,
    #[serde(alias = "default_calendar_id")]
    pub default_calendar_id: Option<String>,
    #[serde(alias = "visible_calendar_ids")]
    pub visible_calendar_ids: Vec<String>,
    #[serde(alias = "first_day_of_week")]
    pub first_day_of_week: u8,
    pub time_format: String,
    #[serde(alias = "automatic_sync")]
    pub automatic_sync: bool,
    #[serde(alias = "sync_interval_minutes")]
    pub sync_interval_minutes: u32,
    #[serde(alias = "selected_month")]
    pub selected_month: String,
    // Local-only customization (never sent to Google).
    pub calendar_colors: HashMap<String, String>,
    pub event_colors: HashMap<String, String>,
    pub font_scale: f64,
    pub density: String,
    pub zoom: f64,
    pub accent_color: Option<String>,
}
impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".into(),
            always_on_top: false,
            start_with_windows: false,
            start_hidden: false,
            remember_position: true,
            remember_size: true,
            opacity: 0.96,
            default_calendar_id: None,
            visible_calendar_ids: vec![],
            first_day_of_week: 1,
            time_format: "24h".into(),
            automatic_sync: true,
            sync_interval_minutes: 15,
            selected_month: "".into(),
            calendar_colors: HashMap::new(),
            event_colors: HashMap::new(),
            font_scale: 1.0,
            density: "comfortable".into(),
            zoom: 1.0,
            accent_color: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub authenticated: bool,
    pub email: Option<String>,
    pub name: Option<String>,
    pub picture: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SyncState {
    pub status: String,
    #[serde(alias = "last_synced_at")]
    pub last_synced_at: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WindowState {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<f64>,
    pub height: Option<f64>,
}
