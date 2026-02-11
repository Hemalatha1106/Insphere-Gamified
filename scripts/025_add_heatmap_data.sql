-- Add heatmap_data column to coding_stats table
alter table coding_stats
add column if not exists heatmap_data jsonb;
