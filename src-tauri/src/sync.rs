use crate::{auth::AuthManager, calendar, error::AppError, models::SyncState};
use chrono::Utc;

pub async fn sync_now(auth:&mut AuthManager,app:&tauri::AppHandle)->Result<SyncState,AppError>{let count=calendar::sync(auth,app).await?;Ok(SyncState{status:"synced".into(),last_synced_at:Some(Utc::now().to_rfc3339()),message:Some(format!("{count} events synchronized"))})}
